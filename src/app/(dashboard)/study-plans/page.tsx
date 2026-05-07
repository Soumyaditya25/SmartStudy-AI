export default function StudyPlansPage() {
    return (
        <div className="h-full flex items-center justify-center p-6">
            <div className="neo-card max-w-lg w-full p-8 text-center bg-neo-bg">
                <div className="w-16 h-16 bg-neo-purple flex items-center justify-center mx-auto mb-6" style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}>
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4">Study Plans</h1>
                <p className="text-neo-black/70 mb-8 font-medium">
                    AI-generated personalized study schedules based on your exams and goals are coming soon! We are putting the final touches on this feature.
                </p>
            </div>
        </div>
    );
}
