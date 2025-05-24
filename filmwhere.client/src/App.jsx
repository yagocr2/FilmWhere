import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AnonymousRoute } from './utils/ProtectedRoute';

// Public pages
import Home from './modules/Home/Home';
import Login from './components/Login';
import Register from './components/Register';

// Protected pages
import Inicio from './modules/Inicio/Inicio';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';

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
                        </Route>

                        {/* Protected routes - accessible only when authenticated */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/inicio" element={<AuthLayout><Inicio /></AuthLayout>} />
                            {/* Add more protected routes here, using AuthLayout */}
                            {/* <Route path="/buscar" element={<AuthLayout><Search /></AuthLayout>} /> */}
                            {/* <Route path="/favoritos" element={<AuthLayout><Favorites /></AuthLayout>} /> */}
                            {/* <Route path="/ver-ahora" element={<AuthLayout><WatchNow /></AuthLayout>} /> */}
                            {/* <Route path="/perfil" element={<AuthLayout><Profile /></AuthLayout>} /> */}

                            {/* You can also create routes for individual movie pages */}
                            {/* <Route path="/pelicula/:id" element={<AuthLayout><MovieDetail /></AuthLayout>} /> */}
                        </Route>

                        {/* Special case - public access with different layout */}
                        <Route path="/inicio-publico" element={<Layout><Inicio /></Layout>} />

                        {/* Fallback route for any other URL */}
                        <Route path="*" element={<Layout><div className="bg-primario text-bg-primario rounded p-12 text-center dark:bg-primario-dark dark:text-bg-primario-dark">Página no encontrada</div></Layout>} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;