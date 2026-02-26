import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Recovery from './pages/shared/recovery/recovery';
import LoginPage from './pages/shared/login/login';
import PageInital from './pages/shared/initial/initial';
import CreateAccount from './pages/shared/createCount/createAccount';
import HelpPage from './pages/shared/HelpPage';
import TermsPage from './pages/shared/TermsPage';

// 🔐 importar PrivateRoute
import PrivateRoute from './routes/privateRoute';

// ADIMINISTRADOR
import DashboardAdmin from './pages/admin/dashadmin/dashboardAdmin';
import DashboardUsers from './pages/admin/dashboardUsers/users';
import DashboardSpecialties from './pages/admin/dashboardSpecialties/specialties';
import Services from './pages/admin/dashboardServices/services';
import DashboardStilist from './pages/admin/dashboardStilist/stilist';
import Reports from './pages/admin/dashboardReports/reports';
import ManageSchedules from './pages/admin/dashboardSchedules/horarios';

// EMPLEADO
import DashboardEmployee from './pages/employee/dashboardEmployee';
import DashboardProfileEmployee from './pages/employee/dashboardProfileEmployee/dashboardProfileEmployee';
import DashboardCalendarEmployee from './pages/employee/dashboardCalendarEmployee/dashboardCalendarEmployee';

//CLIENTE
import DashboardClient from './pages/client/dashboardClient';
import PerfilCliente from './pages/client/dashboardPerfilCliente/dashboardPerfilCliente';


// import PageInital from './pages/shared/initial/initial'
import ReservasAdmin from './pages/admin/dashboardReservas/reservas'
import ReservationSteps from './pages/client/components/reservationSteps/ReservationSteps'
import MisReservas from './pages/client/components/misReservas/MisReservas'
import UpdatePassword from './pages/shared/updatePassword/updatePassword'


function App() {
  return (
      <Routes>
        <Route path='/' element={<Layout/>}>
            <Route path='/' element={<PageInital/>}/>
            <Route path='help' element={<HelpPage/>}/>
            <Route path='terms' element={<TermsPage/>}/>
            <Route path='dashboard-login' element={<LoginPage/>}/>
            <Route path='dashboard-recovery' element={<Recovery/>}/>
            <Route path='dashboard-update-password' element={<UpdatePassword/>}/>
            <Route path='dashboard-admin' element={<PrivateRoute allowedRoles={[1]}><DashboardAdmin/></PrivateRoute>}/>
            <Route path='dashboard-users' element={<PrivateRoute allowedRoles={[1]}><DashboardUsers/></PrivateRoute>}/>
            <Route path='dashboard-specialites' element={<PrivateRoute allowedRoles={[1]}><DashboardSpecialties/></PrivateRoute>}/>
            <Route path='dashboard-employee' element={<PrivateRoute allowedRoles={[2]}><DashboardEmployee/></PrivateRoute>}/>
            <Route path='dashboard-profile-employee' element={<PrivateRoute allowedRoles={[2]}><DashboardProfileEmployee/></PrivateRoute>}/>
            <Route path='dashboard-calendar-employee' element={<PrivateRoute allowedRoles={[2]}><DashboardCalendarEmployee/></PrivateRoute>}/>
            <Route path='dashboard-createAccount' element={<CreateAccount/>}/>
            <Route path='dashboard-reservas' element={<PrivateRoute allowedRoles={[1]}><ReservasAdmin/></PrivateRoute>}/>
            <Route path='dashboard-Services' element={<PrivateRoute allowedRoles={[1]}><Services/></PrivateRoute>}/>
            <Route path='dashboard-stilist' element={<PrivateRoute  allowedRoles={[1]}><DashboardStilist/></PrivateRoute>}/>
            <Route path='dashboard-reports' element={<PrivateRoute  allowedRoles={[1]}><Reports/></PrivateRoute>}/>
            <Route path='dashboard-schedules' element={<PrivateRoute allowedRoles={[1]}><ManageSchedules/></PrivateRoute>}/>
            <Route path='dashboard-client' element={<PrivateRoute allowedRoles={[3]}><DashboardClient/></PrivateRoute>}/>
            <Route path='dashboard-perfil-cliente' element={<PrivateRoute allowedRoles={[3]}><PerfilCliente/></PrivateRoute>}/>
            <Route path='crear-reserva-cliente' element={<PrivateRoute allowedRoles={[3]}><ReservationSteps/></PrivateRoute>}/>
            <Route path='mis-reservas-cliente' element={<PrivateRoute allowedRoles={[3]}><MisReservas/></PrivateRoute>}/>
            

        </Route>
      </Routes>
  );
}

export default App;
