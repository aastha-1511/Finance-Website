import React, { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const VideoCall = ({ socket, roomId, userName, onClose }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(new MediaStream()); // persistent stream object

    const [status, setStatus] = useState('connecting');
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [remoteUser, setRemoteUser] = useState('');

    /* ── Create / reuse RTCPeerConnection ───────────────────────────────────── */
    const getPC = useCallback(() => {
        if (pcRef.current) return pcRef.current;
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // ICE candidates → signal
        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit('webrtc:ice', { roomId, candidate: e.candidate });
        };

        // Remote tracks arrive — attach to the persistent MediaStream
        pc.ontrack = (e) => {
            e.streams[0]?.getTracks().forEach(track => {
                remoteStreamRef.current.addTrack(track);
            });
            // Also handle the case where e.streams is empty (Firefox)
            if (!e.streams[0]) remoteStreamRef.current.addTrack(e.track);

            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
            setStatus('in-call');
        };

        pc.oniceconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
                setStatus('ended');
            }
        };

        pcRef.current = pc;
        return pc;
    }, [roomId, socket]);

    /* ── Mount: get camera + mic, join WebRTC room ──────────────────────────── */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                // Set srcObject early so it's ready when tracks arrive
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                }

                socket.emit('webrtc:join', { roomId, userName });
            } catch (err) {
                setStatus('ended');
                alert('Camera/mic error: ' + err.message);
            }
        })();

        return () => { alive = false; };
    }, [roomId, socket, userName]);

    /* ── Make sure remote video gets its srcObject when the element mounts ──── */
    const setRemoteVideoRef = useCallback((el) => {
        remoteVideoRef.current = el;
        if (el) el.srcObject = remoteStreamRef.current;
    }, []);

    /* ── Socket signaling events ─────────────────────────────────────────────── */
    useEffect(() => {
        const addLocalTracks = (pc) => {
            localStreamRef.current?.getTracks().forEach(t => {
                // Avoid adding duplicate tracks
                const senders = pc.getSenders();
                if (!senders.find(s => s.track === t)) pc.addTrack(t, localStreamRef.current);
            });
        };

        const onPeerJoined = async ({ userName: peer }) => {
            setRemoteUser(peer);
            const pc = getPC();
            addLocalTracks(pc);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', { roomId, offer, userName });
        };

        const onOffer = async ({ offer, userName: peer }) => {
            setRemoteUser(peer);
            const pc = getPC();
            addLocalTracks(pc);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:answer', { roomId, answer });
        };

        const onAnswer = async ({ answer }) => {
            const pc = getPC();
            if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const onIce = async ({ candidate }) => {
            try {
                const pc = getPC();
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch { }
        };

        const onPeerLeft = () => {
            setStatus('ended');
            remoteStreamRef.current.getTracks().forEach(t => t.stop());
        };

        socket.on('webrtc:peer-joined', onPeerJoined);
        socket.on('webrtc:offer', onOffer);
        socket.on('webrtc:answer', onAnswer);
        socket.on('webrtc:ice', onIce);
        socket.on('webrtc:peer-left', onPeerLeft);
        socket.on('webrtc:waiting', () => setStatus('waiting'));
        socket.on('webrtc:full', () => { alert('Room is full (max 2 people)'); onClose(); });

        return () => {
            socket.off('webrtc:peer-joined', onPeerJoined);
            socket.off('webrtc:offer', onOffer);
            socket.off('webrtc:answer', onAnswer);
            socket.off('webrtc:ice', onIce);
            socket.off('webrtc:peer-left', onPeerLeft);
            socket.off('webrtc:waiting');
            socket.off('webrtc:full');
        };
    }, [getPC, roomId, socket, userName, onClose]);

    /* ── Hang up ────────────────────────────────────────────────────────────── */
    const hangUp = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        remoteStreamRef.current.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        socket.emit('webrtc:leave', { roomId, userName });
        onClose();
    }, [onClose, roomId, socket, userName]);

    const toggleMute = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setMuted(m => !m);
    };

    const toggleVideo = () => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setVideoOff(v => !v);
    };

    const statusMsg = {
        connecting: 'Connecting…',
        waiting: 'Waiting for someone to join with the same room code…',
        'in-call': `In call${remoteUser ? ` with ${remoteUser}` : ''}`,
        ended: 'Call ended',
    }[status];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 2000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            {/* Video area */}
            <div style={{
                position: 'relative', width: '90vw', maxWidth: '960px', aspectRatio: '16/9',
                background: '#111', borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
            }}>
                {/* Remote (full-screen) */}
                <video
                    ref={setRemoteVideoRef}
                    autoPlay playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#111' }}
                />

                {/* Status overlay when not in call */}
                {status !== 'in-call' && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '12px',
                        background: 'rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
                        }}>
                            {status === 'ended' ? '📵' : '📡'}
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#e5e7eb', textAlign: 'center', maxWidth: '400px' }}>
                            {statusMsg}
                        </p>
                        {status === 'waiting' && (
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#a5b4fc' }}>
                                Room: {roomId}
                            </div>
                        )}
                    </div>
                )}

                {/* Local video (PiP) */}
                <video
                    ref={localVideoRef}
                    autoPlay playsInline muted
                    style={{
                        position: 'absolute', bottom: '16px', right: '16px', width: '200px',
                        borderRadius: '10px', border: '2px solid rgba(255,255,255,0.3)',
                        background: '#000', boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                    }}
                />

                {/* Status badge */}
                <div style={{
                    position: 'absolute', top: '14px', left: '14px',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '5px 14px',
                    borderRadius: '20px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(8px)'
                }}>
                    <span style={{
                        display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                        background: status === 'in-call' ? '#22c55e' : '#f59e0b',
                        marginRight: '8px', verticalAlign: 'middle'
                    }} />
                    {status === 'in-call' ? `🔴 Live · ${remoteUser}` : statusMsg}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', alignItems: 'center' }}>
                <CtrlBtn onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'} active={muted} />
                <CtrlBtn onClick={toggleVideo} label={videoOff ? 'Cam On' : 'Cam Off'} active={videoOff} />
                <button onClick={hangUp} style={{
                    padding: '12px 32px', borderRadius: '50px', border: 'none',
                    background: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '15px',
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.5)'
                }}>
                    End Call
                </button>
            </div>
        </div>
    );
};

const CtrlBtn = ({ onClick, label, active }) => (
    <button onClick={onClick} style={{
        padding: '12px 20px', borderRadius: '50px',
        border: `1.5px solid ${active ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)'}`,
        background: active ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
        color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
        backdropFilter: 'blur(8px)'
    }}>
        {label}
    </button>
);

export default VideoCall;
