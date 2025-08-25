class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.scores = { ui: 0, ux: 0, coding: 0 };
        this.results = {};
        
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.displayCurrentQuestion();
    }

    async loadQuestions() {
        try {
            const response = await fetch('quiz-questions.json');
            const data = await response.json();
            this.questions = data.questions;
            this.results = data.results;
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load quiz questions. Please refresh the page.');
        }
    }

    setupEventListeners() {
        const nextBtn = document.getElementById('next-btn');
        const restartBtn = document.getElementById('restart-btn');
        const shareBtn = document.getElementById('share-btn');

        nextBtn.addEventListener('click', () => this.handleNextQuestion());
        restartBtn.addEventListener('click', () => this.restartQuiz());
        shareBtn.addEventListener('click', () => this.shareResults());
    }

    displayCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;

        document.getElementById('question-text').textContent = question.question;
        document.getElementById('question-counter').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;

        this.updateProgressBar();
        this.displayOptions(question.options);
        
        document.getElementById('next-btn').disabled = true;
    }

    displayOptions(options) {
        const container = document.getElementById('options-container');
        container.innerHTML = '';

        const colorClasses = ['audience', 'platform', 'chaos'];

        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option ${colorClasses[index % colorClasses.length]}`;
            optionElement.textContent = option.text;
            optionElement.addEventListener('click', () => this.selectOption(index, optionElement));
            container.appendChild(optionElement);
        });
    }

    selectOption(optionIndex, optionElement) {
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
        
        this.answers[this.currentQuestionIndex] = optionIndex;
        document.getElementById('next-btn').disabled = false;
    }

    handleNextQuestion() {
        const selectedOption = this.questions[this.currentQuestionIndex].options[this.answers[this.currentQuestionIndex]];
        this.updateScores(selectedOption.scores);

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.displayCurrentQuestion();
        }
    }

    updateScores(optionScores) {
        this.scores.ui += optionScores.ui || 0;
        this.scores.ux += optionScores.ux || 0;
        this.scores.coding += optionScores.coding || 0;
    }

    updateProgressBar() {
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progress').style.width = `${progress}%`;
    }

    showResults() {
        const personalityType = this.determinePersonalityType();
        const personality = this.results[personalityType];

        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('results-container').classList.remove('hidden');

        this.displayPersonalityResult(personalityType, personality);
        this.displayScoreBreakdown();
        this.animateResults();
    }

    determinePersonalityType() {
        const maxScore = Math.max(this.scores.ui, this.scores.ux, this.scores.coding);
        
        if (this.scores.ui === maxScore) return 'ui';
        if (this.scores.ux === maxScore) return 'ux';
        return 'coding';
    }

    displayPersonalityResult(type, personality) {
        const iconElement = document.getElementById('personality-icon');
        iconElement.className = `personality-icon ${type}`;
        iconElement.textContent = this.getPersonalityEmoji(type);

        document.getElementById('personality-title').textContent = personality.title;
        document.getElementById('personality-description').textContent = personality.description;

        const traitsList = document.getElementById('personality-traits');
        traitsList.innerHTML = '';
        personality.traits.forEach(trait => {
            const li = document.createElement('li');
            li.textContent = trait;
            traitsList.appendChild(li);
        });
    }

    getPersonalityEmoji(type) {
        const emojis = {
            ui: '🎨',
            ux: '🔍',
            coding: '💻'
        };
        return emojis[type] || '⚡';
    }

    displayScoreBreakdown() {
        const maxScore = Math.max(this.scores.ui, this.scores.ux, this.scores.coding);
        const totalPossible = this.questions.length * 3;

        Object.keys(this.scores).forEach(type => {
            const percentage = maxScore > 0 ? (this.scores[type] / maxScore) * 100 : 0;
            const actualPercentage = (this.scores[type] / totalPossible) * 100;
            
            document.getElementById(`${type}-score-fill`).style.width = `${percentage}%`;
            document.getElementById(`${type}-score-text`).textContent = 
                `${Math.round(actualPercentage)}%`;
        });
    }

    animateResults() {
        setTimeout(() => {
            document.querySelectorAll('.score-fill').forEach(fill => {
                fill.style.transition = 'width 1s ease-out';
            });
        }, 300);
    }

    restartQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.scores = { ui: 0, ux: 0, coding: 0 };

        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');

        this.displayCurrentQuestion();
    }

    shareResults() {
        const personalityType = this.determinePersonalityType();
        const personality = this.results[personalityType];
        const shareText = `I just discovered my design superpower: ${personality.title}! ${personality.description}`;

        if (navigator.share) {
            navigator.share({
                title: 'My Design Personality Quiz Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(`${shareText}\n\nTake the quiz: ${window.location.href}`)
                .then(() => {
                    this.showToast('Results copied to clipboard!');
                })
                .catch(() => {
                    this.showToast('Unable to copy. Try again or share manually.');
                });
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.querySelector('.quiz-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">Oops!</h3>
                <p style="color: #6b7280;">${message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});