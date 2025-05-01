// components/Home.jsx
import { Link } from 'react-router-dom';
import ScrollVelocity from "../../TextAnimations/ScrollVelocity/ScrollVelocity";
import Liquid from "../../Backgrounds/LiquidChrome/LiquidChrome.jsx";
import ShinyText from "../../TextAnimations/ShinyText/ShinyText";
import StarBorder from "../../Animations/StarBorder/StarBorder"

const Home = () => {
    return (
        <div>
            {/*Cabecera*/}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-end space-x-5 backdrop-blur-md bg-black/30 rounded-bl-lg">
                {/* Botón de login*/}

                <Link to="/login">
                    <ShinyText
                        className="hover:scale-105 transition-transform bg-transparent"
                        text="Login"
                        disabled={false}
                        velocity={5}
                        fontSize="1.1rem"
                    />
                </Link>
                {/*Botón de registro*/}
                <Link to="/register">
                    <ShinyText
                        className="hover:scale-105 transition-transform bg-transparent"
                        text="Register"
                        disabled={false}
                        velocity={5}
                        fontSize="1.1rem"
                    />
                </Link>
            </div>
            {/*Fondo*/}
            <div className="fixed inset-0 z-0">
                <Liquid
                    baseColor={[0.01, 0, 0.01]}
                    amplitude={0.5}
                    speed={0.3}
                    interactive={false}
                />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                <ScrollVelocity
                    texts={['Bienvenido a', 'FilmWhere']}
                    velocity={15}
                    parallaxClassName="w-full"
                />
            </div>
        </div >
    );
};

export default Home;