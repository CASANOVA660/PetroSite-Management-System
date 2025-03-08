import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { activateAccount } from '../../store/slices/userSlice';
import Button from '../../components/ui/button/Button';
import Alert from '../../components/ui/alert/Alert';

export default function ActivationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            navigate('/signin');
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Token d\'activation invalide');
            return;
        }
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setLoading(true);
        try {
            await dispatch(activateAccount({ token, newPassword: password })).unwrap();
            // Show success message and redirect to login
            navigate('/login', {
                state: {
                    message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.'
                }
            });
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'activation du compte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-navy-900">
            <div className="w-full max-w-md p-6">
                <div className="mt-7 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-navy-800 dark:border-navy-700">
                    <div className="p-4 sm:p-7">
                        <div className="text-center">
                            <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">
                                Activation de votre compte
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Veuillez définir votre nouveau mot de passe pour activer votre compte
                            </p>
                        </div>

                        <div className="mt-5">
                            {error && (
                                <Alert
                                    variant="error"
                                    title="Erreur"
                                    message={error}
                                    showLink={false}
                                />
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                    dark:bg-navy-900 dark:border-navy-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Confirmer le mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                    dark:bg-navy-900 dark:border-navy-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Activation en cours...' : 'Activer mon compte'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 