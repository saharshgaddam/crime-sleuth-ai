
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CaseComponent from "./Case/index";

export default function Case() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Redirect to the proper case path if needed
    if (location.pathname === '/case') {
      navigate('/dashboard');
    }
  }, [location, navigate]);
  
  return <CaseComponent />;
}
