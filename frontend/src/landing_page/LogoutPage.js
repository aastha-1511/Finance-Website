import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This page is hit when the dashboard logs out.
// It clears the frontend's localStorage (different origin = separate storage)
// and redirects to the home page.
const LogoutPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    }, [navigate]);

    return null;
};

export default LogoutPage;
