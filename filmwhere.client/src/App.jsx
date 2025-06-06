import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AnonymousRoute } from './utils/ProtectedRoute';

// Public pages
import Home from './modules/Home/Home';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Search from './modules/Search/Search';
import DetallePeli from './modules/DetallePelicula/DetallePelicula';
import EmailConfirmacion from './components/EmailConfirmacion/EmailConfirmacion';


// Protected pages
import Inicio from './modules/Inicio/Inicio';
import Layout from './components/Layouts/Layout';
import AuthLayout from './components/Layouts/AuthLayout';
import Perfil from './modules/Perfil/Perfil';

// Other pages that need to be added to your application
// import Profile from './modules/Profile/Profile';
// import Search from './modules/Search/Search';
// import Favorites from './modules/Favorites/Favorites';
// import WatchNow from './modules/WatchNow/WatchNow';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public routes - redirect to Inicio if logged in */}
                        <Route element={<AnonymousRoute />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/confirm-email" element={<EmailConfirmacion />} />
                        </Route>

                        {/* Protected routes - accessible only when authenticated */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/inicio" element={<AuthLayout><Inicio /></AuthLayout>} />
                            <Route path="/buscar" element={<AuthLayout><Search /></AuthLayout>} />
                            <Route path="/perfil" element={<AuthLayout><Perfil /></AuthLayout>} />
                            <Route path="/perfil/:userId" element={<AuthLayout><Perfil /></AuthLayout>} />

                            {/* Add more protected routes here, using AuthLayout */}
                            {/* <Route path="/favoritos" element={<AuthLayout><Favorites /></AuthLayout>} /> */}
                            {/* <Route path="/ver-ahora" element={<AuthLayout><WatchNow /></AuthLayout>} /> */}

                            {/* You can also create routes for individual movie pages */}
                            <Route path="/pelicula/:id" element={<AuthLayout><DetallePeli /></AuthLayout>} />
                        </Route>

                        {/* Special case - public access with different layout */}
                        <Route path="/inicio-publico" element={<Layout><Inicio /></Layout>} />
                        <Route path="/buscar-publico" element={<Layout><Search /></Layout>} />
                        <Route path="/pelicula-publica/:id" element={<Layout><DetallePeli /></Layout>} />


                        {/* Fallback route for any other URL */}
                        <Route path="*" element={<div className="text-bg-primario bg-primario rounded p-12 text-center dark:bg-primario-dark dark:text-bg-primario-dark">Página no encontrada</div>} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;