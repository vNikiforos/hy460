document.addEventListener('DOMContentLoaded', function() {
  // Mode switching
  const allBtn = document.getElementById('show-all-btn');
  const quizBtn = document.getElementById('quiz-mode-btn');
  const allDiv = document.getElementById('questions-all');
  const quizDiv = document.getElementById('quiz-mode');
  const quizQ = document.getElementById('quiz-question');
  const nextBtn = document.getElementById('next-question-btn');
  const prevBtn = document.getElementById('prev-question-btn');
  const questions = Array.from(document.querySelectorAll('.question'));
  
  // Track question history for navigation
  let questionHistory = [];
  let currentQuestionIndex = -1;
  let isTransitioning = false;

  // Show all questions mode
  function showAll() {
    allDiv.style.display = '';
    quizDiv.style.display = 'none';
  }

  // Quiz mode (one random question at a time)
  function showQuiz() {
    allDiv.style.display = 'none';
    quizDiv.style.display = '';
    // Reset history when entering quiz mode
    questionHistory = [];
    currentQuestionIndex = -1;
    showNextQuestion();
  }

  // Show a random question and add to history
  function showNextQuestion() {
    if (questions.length === 0) {
      quizQ.innerHTML = '<div>Δεν υπάρχουν ερωτήσεις.</div>';
      prevBtn.disabled = true;
      return;
    }
    
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Fade out current question
    quizQ.style.opacity = '0';
    quizQ.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      // Get a random question index
      const idx = Math.floor(Math.random() * questions.length);
      
      // If we're navigating through history and not at the end,
      // truncate the future history
      if (currentQuestionIndex < questionHistory.length - 1) {
        questionHistory = questionHistory.slice(0, currentQuestionIndex + 1);
      }
      
      // Add this question to history
      questionHistory.push(idx);
      currentQuestionIndex = questionHistory.length - 1;
      
      // Show the question
      displayCurrentQuestion();
      
      // Fade in new question
      setTimeout(() => {
        quizQ.style.opacity = '1';
        quizQ.style.transform = 'translateY(0)';
        isTransitioning = false;
      }, 50);
    }, 300);
  }
  
  // Show the previous question from history
  function showPreviousQuestion() {
    if (currentQuestionIndex <= 0 || isTransitioning) {
      prevBtn.disabled = true;
      return;
    }
    
    isTransitioning = true;
    
    // Fade out current question
    quizQ.style.opacity = '0';
    quizQ.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      currentQuestionIndex--;
      displayCurrentQuestion();
      
      // Fade in new question
      setTimeout(() => {
        quizQ.style.opacity = '1';
        quizQ.style.transform = 'translateY(0)';
        isTransitioning = false;
      }, 50);
    }, 300);
  }
  
  // Display the current question based on history index
  function displayCurrentQuestion() {
    const idx = questionHistory[currentQuestionIndex];
    const questionClone = questions[idx].cloneNode(true);
    
    quizQ.innerHTML = '';
    quizQ.appendChild(questionClone);
    
    // Re-attach event handlers to the cloned question
    attachEventHandlers(questionClone);
    
    // Update navigation button states
    prevBtn.disabled = currentQuestionIndex <= 0;
  }
  
  // Multiple choice questions
  function setupMultipleChoice(question) {
    const options = question.querySelectorAll('.option-wrapper');
    const checkBtn = question.querySelector('.check-btn');
    const result = question.querySelector('.result');
    const explanation = question.querySelector('.explanation');
    const correctAnswer = question.dataset.correct;
    
    if (!options.length) return;
    
    // Add click handler for the whole option wrapper (better for touch)
    options.forEach(wrapper => {
      // Reset any previous styling
      wrapper.classList.remove('selected', 'correct', 'wrong');
      
      wrapper.addEventListener('click', function(e) {
        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        
        const x = e.clientX - rect.left - size/2;
        const y = e.clientY - rect.top - size/2;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
        
        // Find the radio input inside this wrapper and check it
        const radio = wrapper.querySelector('input[type="radio"]');
        if (radio) {
          // Clear any previous selections
          options.forEach(opt => {
            opt.classList.remove('selected', 'correct', 'wrong');
            const optRadio = opt.querySelector('input[type="radio"]');
            if (optRadio) optRadio.checked = false;
          });
          
          // Mark this one as selected with the neutral color
          radio.checked = true;
          wrapper.classList.add('selected');
          
          // Enable check button if disabled
          if (checkBtn && checkBtn.disabled) {
            checkBtn.disabled = false;
          }
        }
      });
    });
    
    if (checkBtn) {
      // Initially disable check button until an option is selected
      checkBtn.disabled = !question.querySelector('.option-wrapper.selected, input[type="radio"]:checked');
      
      checkBtn.addEventListener('click', function() {
        // Check if any option is selected visually (by class) or by radio button state
        const selectedOption = question.querySelector('.option-wrapper.selected');
        const selected = question.querySelector('input[type="radio"]:checked');
        
        if (!selectedOption && !selected) {
          result.textContent = 'Παρακαλώ επιλέξτε μια απάντηση';
          result.className = 'result';
          result.style.display = '';
          return;
        }
        
        // Clear previous classes
        options.forEach(opt => opt.classList.remove('correct', 'wrong'));
        
        // Get the selected wrapper and value
        const selectedWrapper = selectedOption || selected.closest('.option-wrapper');
        const selectedValue = selected ? selected.value : selectedWrapper.dataset.option;
        
        // Mark correct/wrong answers
        if (selectedValue === correctAnswer) {
          // Correct answer
          selectedWrapper.classList.remove('selected');
          selectedWrapper.classList.add('correct');
          result.textContent = 'Σωστή απάντηση!';
          result.className = 'result correct';
        } else {
          // Wrong answer
          selectedWrapper.classList.remove('selected');
          selectedWrapper.classList.add('wrong');
          
          // Find and mark the correct answer
          const correctWrapper = Array.from(options).find(opt => 
            opt.dataset.option === correctAnswer
          );
          
          if (correctWrapper) {
            correctWrapper.classList.add('correct');
          }
          
          result.textContent = `Λάθος απάντηση. Η σωστή είναι: ${correctAnswer}`;
          result.className = 'result incorrect';
        }
        
        result.style.display = '';
        
        // Scroll to result if needed
        setTimeout(() => {
          if (!isElementInViewport(result)) {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
        
        if (explanation) {
          explanation.style.display = '';
        }
      });
    }
  }
  
  // True/False questions
  function setupTrueFalse(question) {
    const buttons = question.querySelectorAll('.tf-btn');
    const result = question.querySelector('.result');
    const explanation = question.querySelector('.explanation');
    const correctAnswer = question.dataset.correct;
    
    if (!buttons.length) return;
    
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // Add pulse animation
        this.classList.add('pulse');
        setTimeout(() => {
          this.classList.remove('pulse');
        }, 500);
        
        // Reset all buttons
        buttons.forEach(b => b.classList.remove('selected'));
        
        // Select this button
        this.classList.add('selected');
        
        // Check answer
        if (this.dataset.value === correctAnswer) {
          result.textContent = 'Σωστή απάντηση!';
          result.className = 'result correct';
        } else {
          result.textContent = `Λάθος απάντηση. Η σωστή είναι: ${correctAnswer === 'true' ? 'Σωστό' : 'Λάθος'}`;
          result.className = 'result incorrect';
        }
        
        result.style.display = '';
        if (explanation) {
          explanation.style.display = '';
        }
        
        // Scroll to result if needed
        setTimeout(() => {
          if (!isElementInViewport(result)) {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      });
    });
  }
  
  // Flashcards
  function setupFlashcard(question) {
    const flipBtn = question.querySelector('.flip-btn');
    const card = question.querySelector('.card');
    const front = question.querySelector('.front');
    const back = question.querySelector('.back');
    
    if (!flipBtn || !back) return;
    
    let isFlipped = false;
    
    // Allow tapping on the card itself to toggle the answer
    if (card) {
      card.addEventListener('click', function(e) {
        // Only trigger if clicking directly on the card or its children,
        // not on other interactive elements
        if (e.target.closest('button')) return;
        toggleFlip();
      });
    }
    
    flipBtn.addEventListener('click', toggleFlip);
    
    function toggleFlip() {
      if (isFlipped) {
        // Hide answer with sliding animation
        back.classList.remove('visible');
        flipBtn.textContent = 'Εμφάνιση απάντησης';
      } else {
        // Show answer with sliding animation
        back.classList.add('visible');
        flipBtn.textContent = 'Απόκρυψη απάντησης';
        
        // Scroll to make the answer visible if needed
        setTimeout(() => {
          if (!isElementInViewport(back)) {
            back.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 300);
      }
      
      isFlipped = !isFlipped;
    }
  }
  
  // Fill in the blank
  function setupFillBlank(question) {
    const input = question.querySelector('input[type="text"]');
    const checkBtn = question.querySelector('.check-btn');
    const revealBtn = question.querySelector('.reveal-btn');
    const answerReveal = question.querySelector('.answer-reveal');
    const result = question.querySelector('.result');
    const hintBtn = question.querySelector('.hint-btn');
    const hint = question.querySelector('.hint');
    const correctAnswer = question.dataset.correct;
    
    if (!input) return;
    
    // Enhance input with focus effects
    input.addEventListener('focus', function() {
      this.parentNode.classList.add('input-focus');
    });
    
    input.addEventListener('blur', function() {
      this.parentNode.classList.remove('input-focus');
    });
    
    // Allow Enter key to submit
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && checkBtn) {
        checkBtn.click();
      }
    });
    
    // Enable check button only when input has value
    input.addEventListener('input', function() {
      if (checkBtn) {
        checkBtn.disabled = !this.value.trim();
      }
    });
    
    if (checkBtn) {
      // Initially disable check button
      checkBtn.disabled = !input.value.trim();
      
      checkBtn.addEventListener('click', function() {
        const userAnswer = input.value.trim();
        
        if (!userAnswer) {
          result.textContent = 'Παρακαλώ συμπληρώστε την απάντησή σας';
          result.className = 'result';
          result.style.display = '';
          return;
        }
        
        // Simple normalized comparison (case insensitive)
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
          result.textContent = 'Σωστή απάντηση!';
          result.className = 'result correct';
        } else {
          result.textContent = `Λάθος απάντηση. Η σωστή είναι: ${correctAnswer}`;
          result.className = 'result incorrect';
        }
        
        result.style.display = '';
        
        // Scroll to result if needed
        setTimeout(() => {
          if (!isElementInViewport(result)) {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      });
    }
    
    // Reveal answer button
    if (revealBtn && answerReveal) {
      revealBtn.addEventListener('click', function() {
        if (answerReveal.style.display === 'block') {
          answerReveal.style.display = 'none';
          revealBtn.textContent = 'Εμφάνιση απάντησης';
        } else {
          answerReveal.style.display = 'block';
          revealBtn.textContent = 'Απόκρυψη απάντησης';
          
          // Scroll to make the answer visible if needed
          setTimeout(() => {
            if (!isElementInViewport(answerReveal)) {
              answerReveal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        }
      });
    }
    
    if (hintBtn && hint) {
      hintBtn.addEventListener('click', function() {
        hint.style.display = hint.style.display === 'none' ? '' : 'none';
        hintBtn.textContent = hint.style.display === 'none' ? 'Υπόδειξη' : 'Απόκρυψη υπόδειξης';
        
        if (hint.style.display !== 'none') {
          // Scroll to make the hint visible if needed
          setTimeout(() => {
            if (!isElementInViewport(hint)) {
              hint.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        }
      });
    }
  }
  
  // Toggle visibility for solutions, answer points, etc.
  function setupToggleButtons(question) {
    const toggleBtn = question.querySelector('.toggle-btn');
    if (!toggleBtn) return;
    
    // Find the element to toggle based on question type
    let targetElement;
    if (question.classList.contains('problem') || question.classList.contains('calculation')) {
      targetElement = question.querySelector('.solution');
    } else if (question.classList.contains('short-answer')) {
      targetElement = question.querySelector('.answer-points');
    } else if (question.classList.contains('scenario')) {
      targetElement = question.querySelector('.analysis');
    } else if (question.classList.contains('comparison')) {
      targetElement = question.querySelector('.comparison-elements');
    } else if (question.classList.contains('error-ident')) {
      targetElement = question.querySelector('.errors');
    }
    
    if (!targetElement) return;
    
    toggleBtn.addEventListener('click', function() {
      const isHidden = targetElement.style.display === 'none';
      
      if (isHidden) {
        targetElement.style.display = '';
        targetElement.style.maxHeight = '0';
        targetElement.style.opacity = '0';
        
        // Trigger reflow
        void targetElement.offsetWidth;
        
        targetElement.style.maxHeight = targetElement.scrollHeight + 'px';
        targetElement.style.opacity = '1';
        
        toggleBtn.textContent = toggleBtn.textContent.replace('Εμφάνιση', 'Απόκρυψη');
        
        // Scroll to make the content visible if needed
        setTimeout(() => {
          if (!isElementInViewport(targetElement)) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 300);
      } else {
        targetElement.style.maxHeight = '0';
        targetElement.style.opacity = '0';
        
        toggleBtn.textContent = toggleBtn.textContent.replace('Απόκρυψη', 'Εμφάνιση');
        
        // Hide after animation completes
        setTimeout(() => {
          targetElement.style.display = 'none';
        }, 300);
      }
    });
    
    // Initialize state (hidden)
    targetElement.style.display = 'none';
    targetElement.style.maxHeight = '0';
    targetElement.style.opacity = '0';
    targetElement.style.overflow = 'hidden';
    targetElement.style.transition = 'all 0.3s ease-in-out';
  }
  
  // Helper function to check if element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Attach all event handlers to a question
  function attachEventHandlers(question) {
    if (question.classList.contains('mc-question')) {
      setupMultipleChoice(question);
    } else if (question.classList.contains('tf-question')) {
      setupTrueFalse(question);
    } else if (question.classList.contains('flashcard')) {
      setupFlashcard(question);
    } else if (question.classList.contains('fillblank')) {
      setupFillBlank(question);
    }
    
    // For question types with toggle buttons
    setupToggleButtons(question);
  }
  
  // Attach handlers to all questions on the page
  questions.forEach(attachEventHandlers);
  
  // Set up mode switching
  allBtn.addEventListener('click', showAll);
  quizBtn.addEventListener('click', showQuiz);
  nextBtn.addEventListener('click', showNextQuestion);
  prevBtn.addEventListener('click', showPreviousQuestion);
  
  // Add pulse effect to navigation buttons
  [nextBtn, prevBtn].forEach(btn => {
    btn.addEventListener('click', function() {
      if (!this.disabled) {
        this.classList.add('btn-pulse');
        setTimeout(() => {
          this.classList.remove('btn-pulse');
        }, 300);
      }
    });
  });
  
  // Style the quiz question container for transitions
  quizQ.style.transition = 'all 0.3s ease';
  quizQ.style.opacity = '1';
  
  // Initialize the Previous button as disabled
  prevBtn.disabled = true;
  
  // Default: show all
  showAll();
}); 