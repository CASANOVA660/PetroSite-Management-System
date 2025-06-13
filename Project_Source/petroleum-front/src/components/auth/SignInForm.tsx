import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { loginUser, clearError } from "../../store/slices/authSlice";
import { useAppSelector } from "../../hooks/useAppSelector";

interface LoginFormData {
  email: string;
  motDePasse: string;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, user } = useAppSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    motDePasse: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'Manager' ? '/manager-dashboard' : '/dashboard');
    }
  }, [user, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="w-full max-w-md p-8 mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl dark:bg-gray-800/90 transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700">
      <div className="flex justify-center mb-6">
        <img
          src="/images/logo/petroconnect-logo.svg"
          alt="PetroConnect Logo"
          className="h-16 drop-shadow-md transition-all duration-500 hover:scale-105"
        />
      </div>

      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90">
          Bienvenue
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Entrez vos identifiants pour accéder à votre compte
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>
            Email <span className="text-error-500">*</span>
          </Label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Entrez votre email"
            type="email"
            className="w-full py-3 transition-all duration-200 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F] dark:border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label>
            Mot de passe <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              name="motDePasse"
              type={showPassword ? "text" : "password"}
              value={formData.motDePasse}
              onChange={handleInputChange}
              placeholder="Entrez votre mot de passe"
              className="w-full py-3 transition-all duration-200 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F] dark:border-gray-700"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <Checkbox checked={isChecked} onChange={setIsChecked} />
          <span className="ml-3 block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
            Rester connecté
          </span>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FA812F] hover:bg-[#e97626] text-white py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
          size="sm"
          disabled={loading}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
