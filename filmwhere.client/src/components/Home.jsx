// components/Home.jsx
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl">Bienvenido a FilmWhere</h1>
            <Link to="/login" className="text-blue-500 mt-4 inline-block">
                Ir al Login
            </Link>
        </div>
    );
};

export default Home;