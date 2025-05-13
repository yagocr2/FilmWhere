// components/Home.jsx
import { useTheme } from "../../context/ThemeContext";
import ScrollVelocity from "../../TextAnimations/ScrollVelocity/ScrollVelocity";
import Liquid from "../../Backgrounds/LiquidChrome/LiquidChrome.jsx";
import Layout from "../../components/Layout";
import GridMotion from "../../Backgrounds/GridMotion/GridMotion"

const Home = () => {
    const { theme } = useTheme(); // Accede al tema actual
    const items = [
        'Item 1',
        <div key='jsx-item-1'>Custom JSX Content</div>,
        'https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Item 2',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'Item 4',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Item 5',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'Item 7',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Item 8',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'Item 10',
        <div key='jsx-item-3'>Custom JSX Content</div>,
        'https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Item 11',
        <div key='jsx-item-2'>Custom JSX Content</div>,
        'Item 13',
        <div key='jsx-item-4'>Custom JSX Content</div>,
        'https://images.unsplash.com/photo-1723403804231-f4e9b515fe9d?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Item 14',
        // Add more items as needed
    ];
    return (
        <Layout>
            <div className="fixed inset-0 z-0">
                {/*<Liquid*/}
                {/*    baseColor={theme === 'dark'? [0.01, 0, 0.01]:[0.4, 0.4, 0.4]}*/}
                {/*    //baseColor={[0.01, 0, 0.01]}*/}
                {/*    amplitude={0.5}*/}
                {/*    speed={0.3}*/}
                {/*    interactive={false}*/}
                {/*/>*/}
                <GridMotion items={items} gradientColor={"var(--color-primario)"} />
            </div>

            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 w-full">
                <ScrollVelocity
                    className="text-5xl font-bold text-center text-texto dark:text-texto-dark"
                    texts={['Bienvenido a', 'FilmWhere']}
                    velocity={15}
                    parallaxClassName="w-full"
                />
            </div>
        </Layout>
    );
};
export default Home;