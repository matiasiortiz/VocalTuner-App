import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import MetronomeScreen from './screens/MetronomeScreen';
import HealthScreen from './screens/HealthScreen';
import ScalesScreen from './screens/ScalesScreen';
import CreateScaleScreen from './screens/CreateScaleScreen';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  return (
    <Router>
      <div className="w-full max-w-screen-2xl mx-auto bg-background-light dark:bg-background-dark min-h-screen shadow-2xl relative border-x border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex-1 w-full h-full">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/metronome" element={<MetronomeScreen />} />
            <Route path="/health" element={<HealthScreen />} />
            <Route path="/scales" element={<ScalesScreen />} />
            <Route path="/create-scale" element={<CreateScaleScreen />} />
            <Route path="/edit-scale/:id" element={<CreateScaleScreen />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;