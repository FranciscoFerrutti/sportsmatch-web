import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar } from 'lucide-react';
import styles from './Landing.module.css';
import {NavigationLanding} from "./NavigationLanding";

import soccerBg from '../../images/soccer-background.jpg';
import tennisBg from '../../images/tennis-background.jpg';
import paddleBg from '../../images/paddle-background.jpg';
import hockeyBg from '../../images/hockey-background.jpg';
import fieldBg from '../../images/field.jpg';
import SMApp from '../../images/sportsmatch-app.png';
import playStoreLogo from '../../images/logo_playstore.png';
import appStoreLogo from '../../images/logo_appstore.png';


const sportsBackgrounds = [
    {
        image: soccerBg,
        sport: "Soccer",
        alt: "Soccer field with players"
    },
    {
        image: tennisBg,
        sport: "Tennis",
        alt: "Tennis court with players"
    },
    {
        image: paddleBg,
        sport: "Paddle",
        alt: "Paddle tennis court"
    },
    {
        image: hockeyBg,
        sport: "Hockey",
        alt: "Grass hockey field"
    }
];

export const Landing = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % sportsBackgrounds.length);
        }, 4700);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <NavigationLanding />
            <div className="bg-gray-50 min-h-screen relative overflow-hidden">
                {sportsBackgrounds.map((bg, index) => (
                    <div
                        key={index}
                        className={`${styles.backgroundSlide} ${
                            index === currentIndex ? styles.active : styles.inactive
                        }`}
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bg.image})`,
                            zIndex: 1
                        }}
                    />
                ))}

                <header className="relative z-10 h-[600px] flex items-center text-white">
                    <div className="max-w-6xl mx-auto px-4 py-16 flex items-center relative z-10">
                        <div className={`${styles.heroContent} pr-10`}>
                            <h1 className="text-5xl font-bold mb-6">Encontrá tu Sport Match perfecto</h1>
                            <p className="text-xl mb-8">Conectá con otros jugadores, únete a equipos y descubre eventos
                                deportivos cerca tuyo.</p>
                            <div className="flex space-x-4">
                                <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                                    <img src={playStoreLogo} alt="Disponible en Google Play" className="h-12"/>
                                </a>
                                <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
                                    <img src={appStoreLogo} alt="Descárgalo en el App Store" className="h-12"/>
                                </a>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <div className="bg-gray-50 min-h-screen">
                {/* Features Section */}
                <section className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold mb-12">¡Hacer deporte nunca fue tan fácil!</h2>
                        <div className="flex justify-between space-x-6">
                            <div className={styles.featureCard}>
                                <Users className={`${styles.featureIcon} ${styles.blue}`} />
                                <h3 className="text-xl font-semibold mb-4">Encontrá jugadores</h3>
                                <p>Conectá con personas en tu zona</p>
                            </div>
                            <div className={styles.featureCard}>
                                <MapPin className={`${styles.featureIcon} ${styles.green}`} />
                                <h3 className="text-xl font-semibold mb-4">Eventos locales</h3>
                                <p>Descubrí partidos cerca tuyo</p>
                            </div>
                            <div className={styles.featureCard}>
                                <Calendar className={`${styles.featureIcon} ${styles.purple}`} />
                                <h3 className="text-xl font-semibold mb-4">Fácil de reservar</h3>
                                <p>Organizá y sumate a equipos fácilmente</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Club Section */}
                <section className={`${styles.clubSection} py-16 relative`}>
                    {/* Background Image with Overlay */}
                    <div
                        className={styles.clubBackground}
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${fieldBg})`,
                        }}
                    />

                    {/* Content */}
                    <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl font-bold mb-6 text-white">¿Y si soy un club?</h2>
                        <p className="text-xl mb-8 max-w-3xl mx-auto text-white">
                            Inscríbete en nuestra página web para que nuestros usuarios puedan alquilar tus instalaciones!
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className={`${styles.appStoreButton} ${styles.apple} mx-auto`}
                        >
                            Registrar mi club
                        </button>
                    </div>
                </section>

                {/* How to Use Section */}
                <section className="py-16 bg-gray-100">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-4xl font-bold text-center mb-12">Mirá lo fácil que es usar nuestra app</h2>
                        <div className="flex items-center">
                            <div className="w-1/2 pr-10">
                                <div style={{justifyItems:"center"}}>
                                    <img src={SMApp} alt="SportsMatch App" className={`${styles.appImage} rounded-lg shadow-2xl`} />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <div className="mb-8">
                                    <div className={styles.stepItem}>
                                        <span className={styles.stepNumber}>1</span>
                                        <div>
                                            <h3 className="text-xl font-semibold">Descargá la app</h3>
                                            <p>Disponible en Play Store o del App Store. n° 1 en reservas de canchas.</p>
                                        </div>
                                    </div>
                                    <div className={styles.stepItem}>
                                        <span className={styles.stepNumber}>2</span>
                                        <div>
                                            <h3 className="text-xl font-semibold">Registrate</h3>
                                            <p>Creá una cuenta para comenzar a utilizar la aplicación.</p>
                                        </div>
                                    </div>
                                    <div className={styles.stepItem}>
                                        <span className={styles.stepNumber}>3</span>
                                        <div>
                                            <h3 className="text-xl font-semibold">Reservá un turno</h3>
                                            <p>Seleccioná la fecha y hora deseada en tu complejo.</p>
                                        </div>
                                    </div>
                                    <div className={styles.stepItem}>
                                        <span className={styles.stepNumber}>4</span>
                                        <div>
                                            <h3 className="text-xl font-semibold">¡A jugar!</h3>
                                            <p>Esperá la confirmación del complejo y listo. ¡Qué lo disfrutes!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};