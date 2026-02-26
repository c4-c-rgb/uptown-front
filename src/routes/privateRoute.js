import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = sessionStorage.getItem("user");
  const user = JSON.parse(token);

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.rol?.id))) {
        return <Navigate to="/dashboard-login" replace />;
  }
  return token ? children : <Navigate to="/dashboard-login" />;
};

export default PrivateRoute;