import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import './index.css';
import Home from "./modules/Home/Home"
import Click from "./Animations/ClickSpark/ClickSpark";
import { BrowserRouter } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            <Home />
        </BrowserRouter>

        //<AuthProvider>*/}
        //    <Router>*/}
        //        <Routes>*/}
        //            <Route path="/" element={<Login />} />*/}
        //            <Route path="*" element={<Navigate to="/" />} />*/}
        //        </Routes>*/}
        //    </Router>*/}
        //</AuthProvider>*/}
    );
}

export default App;