import PomodoroTimer from '../components/pomodoro-timer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl mb-8 text-purple-50">Good afternoon ☁️</h1>
        <PomodoroTimer />
      </div>
    </div>
  );
}