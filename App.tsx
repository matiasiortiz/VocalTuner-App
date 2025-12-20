
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import MetronomeScreen from './screens/MetronomeScreen';
import HealthScreen from './screens/HealthScreen';
import ScalesScreen from './screens/ScalesScreen';
import CreateScaleScreen from './screens/CreateScaleScreen';

const App: React.FC = () => {
  return (
    <Router>
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen shadow-2xl overflow-hidden relative border-x border-gray-200 dark:border-gray-800">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/metronome" element={<MetronomeScreen />} />
          <Route path="/health" element={<HealthScreen />} />
          <Route path="/scales" element={<ScalesScreen />} />
          <Route path="/create-scale" element={<CreateScaleScreen />} />
          <Route path="/edit-scale/:id" element={<CreateScaleScreen />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
