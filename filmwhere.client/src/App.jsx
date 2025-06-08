import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AnonymousRoute, AdminRoute, RegisteredRoute } from './utils/ProtectedRoute';

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
import AdminLayout from './components/Layouts/AdminLayout';
import Perfil from './modules/Perfil/Perfil';

// Admin pages
import AdminDashboard from './modules/Admin/AdminDashboard/AdminDashboard';
import AdminUsuarios from './modules/Admin/AdminUsuarios/AdminUsuarios';
//import AdminRoles from './modules/Admin/AdminRoles/AdminRoles';

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

                        {/* Admin routes - only for Administrador role */}
                        <Route element={<AdminRoute />}>
                            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                            <Route path="/admin/usuarios" element={<AdminLayout><AdminUsuarios /></AdminLayout>} />
                            {/*<Route path="/admin/roles" element={<AdminLayout><AdminRoles /></AdminLayout>} />*/}
                        </Route>

                        {/* Protected routes - Layout automatically assigned based on user role */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/inicio" element={<Inicio />} />
                            <Route path="/buscar" element={<Search />} />
                            <Route path="/perfil" element={<Perfil />} />
                            <Route path="/perfil/:userId" element={<Perfil />} />

                            {/* Movie detail route */}
                            <Route path="/pelicula/:id" element={<DetallePeli />} />

                            {/* Add more protected routes here as needed */}
                            {/* <Route path="/favoritos" element={<Favorites />} /> */}
                            {/* <Route path="/ver-ahora" element={<WatchNow />} /> */}
                        </Route>

                        {/* Special case - public access with different layout for non-registered users */}
                        <Route path="/inicio-publico" element={<Layout><Inicio /></Layout>} />
                        <Route path="/buscar-publico" element={<Layout><Search /></Layout>} />
                        <Route path="/pelicula-publica/:id" element={<Layout><DetallePeli /></Layout>} />

                        {/* Fallback route for any other URL */}
                        <Route path="*" element={
                            <div className="flex min-h-screen items-center justify-center">
                                <div className="text-center">
                                    <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-gray-200">
                                        404 - Página no encontrada
                                    </h1>
                                    <p className="mb-8 text-gray-600 dark:text-gray-400">
                                        La página que buscas no existe.
                                    </p>
                                    <a
                                        href="/"
                                        className="rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
                                    >
                                        Volver al inicio
                                    </a>
                                </div>
                            </div>
                        } />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;