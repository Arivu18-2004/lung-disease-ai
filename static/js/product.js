"use strict";
/**
 * LungAI Premium Product Page Interactions
 *
 * Handles IntersectionObserver animations for the scroll-based Stepper
 * and dynamic requestAnimationFrame number counters for the Dashboard Mock.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Numeric Counters (AI Confidence & IoT Vitals)
    const runAnimatedCounters = () => {
        const counters = document.querySelectorAll('.animate-number');
        counters.forEach(counter => {
            const targetStr = counter.dataset.target;
            if (!targetStr)
                return;
            const target = parseFloat(targetStr);
            const isDecimal = targetStr.includes('.');
            const duration = 2000; // ms
            const frameRate = 1000 / 60;
            const totalFrames = Math.round(duration / frameRate);
            let currentFrame = 0;
            const easeOutQuart = (t) => 1 - (--t) * t * t * t;
            const updateCounter = () => {
                currentFrame++;
                const progress = easeOutQuart(currentFrame / totalFrames);
                const currentVal = target * progress;
                if (isDecimal) {
                    counter.innerHTML = currentVal.toFixed(1);
                }
                else {
                    counter.innerHTML = Math.round(currentVal).toString();
                }
                if (currentFrame < totalFrames) {
                    requestAnimationFrame(updateCounter);
                }
                else {
                    counter.innerHTML = isDecimal ? target.toFixed(1) : target.toString();
                }
            };
            updateCounter();
        });
        // Also animate the progress bar
        const confidenceBar = document.getElementById('mockConfidenceBar');
        if (confidenceBar) {
            setTimeout(() => {
                confidenceBar.style.width = '92.4%';
            }, 300);
        }
    };
    // Run counters immediately on load since they are in the Hero
    setTimeout(runAnimatedCounters, 500);
    // 2. IntersectionObserver for the Workflow Stepper
    const stepperWrapper = document.querySelector('.stepper-wrapper');
    const stepperLine = document.querySelector('.stepper-line-active');
    const icons = document.querySelectorAll('.step-icon');
    const texts = document.querySelectorAll('.step-text');
    const subs = document.querySelectorAll('.step-sub');
    const circles = document.querySelectorAll('.stepper-step .step-circle');
    let stepperAnimated = false;
    const stepperObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !stepperAnimated) {
                stepperAnimated = true;
                // 1. Extend the glowing line
                if (stepperLine)
                    stepperLine.style.width = '100%';
                // 2. Staggered step activation
                icons.forEach((icon, i) => {
                    setTimeout(() => {
                        icon.classList.remove('text-body-tertiary');
                        icon.classList.add('text-primary');
                        texts[i].classList.remove('text-muted');
                        texts[i].classList.add('text-dark');
                        subs[i].classList.remove('opacity-50');
                        // Circle 0 is pre-active (Upload), so we target i+1
                        const targetCircle = circles[i + 1];
                        if (targetCircle) {
                            targetCircle.style.setProperty('border-color', 'var(--primary-blue)', 'important');
                            targetCircle.style.boxShadow = "0 4px 15px rgba(11,110,255,0.2)";
                        }
                    }, (i + 1) * 600); // 600ms stagger
                });
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the stepper is visible
    });
    if (stepperWrapper) {
        stepperObserver.observe(stepperWrapper);
    }
});
