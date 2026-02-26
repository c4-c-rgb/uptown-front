import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <main className="min-vh-100 position-relative">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;