// 新首页 - 完整复制上传项目的设计
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import Curriculum from './sections/Curriculum';
import CinematicVision from './sections/CinematicVision';
import AlumniArchives from './sections/AlumniArchives';
import Footer from './sections/Footer';

export function StartPage({ onEnter: _onEnter }: { onEnter: () => void }) {
  return (
    <div
      style={{
        background: '#F8FAFF',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <Navigation />

      <main>
        <Hero />
        <Curriculum />
        <AlumniArchives />
        <CinematicVision />
        <Footer />
      </main>
    </div>
  );
}