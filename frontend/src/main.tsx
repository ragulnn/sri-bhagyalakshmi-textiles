import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider } from './store/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(<StoreProvider><AuthProvider><App /></AuthProvider></StoreProvider>);
