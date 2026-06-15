import { useState } from 'react';
import {
  Header,
  Hero,
  PopularCategories,
  PopularDestinations,
  FeaturedHotels,
  LatestGuides,
  PopularTours,
  CTABanner,
  Footer,
} from './components';

function App() {
  const [language, setLanguage] = useState<'en' | 'mm'>('en');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-white'} transition-colors`}>
      <Header
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
      />
      <main>
        <Hero language={language} />
        <PopularCategories language={language} darkMode={darkMode} />
        <PopularDestinations language={language} darkMode={darkMode} />
        <FeaturedHotels language={language} darkMode={darkMode} />
        <LatestGuides language={language} darkMode={darkMode} />
        <PopularTours language={language} darkMode={darkMode} />
        <CTABanner language={language} />
      </main>
      <Footer language={language} darkMode={darkMode} />
    </div>
  );
}

export default App;
