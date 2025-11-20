/**
 * Home page component.
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';

function Home() {
    const [status, setStatus] = useState('Checking...');

    useEffect(() => {
        api.get('/health/')
            .then(response => {
                setStatus(response.data.message);
            })
            .catch(error => {
                setStatus('Error connecting to backend');
                console.error('API Error:', error);
            });
    }, []);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>AliceTant</h1>
            <p>Your personal booking assistant</p>
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
                <strong>Backend Status:</strong> {status}
            </div>
        </div>
    );
}

export default Home;
