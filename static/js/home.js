"use strict";
/**
 * LungAI Home Page Interactions
 *
 * Handles IntersectionObserver animations for scroll reveals on the main landing page.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Numeric Counters for Hero & Trust Metrics
    const runAnimatedCounters = () => {
        const counters = document.querySelectorAll('.animate-number');
        counters.forEach(counter => {
            const el = counter;
            const targetStr = el.dataset.target;
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
                    el.innerHTML = currentVal.toFixed(1);
                }
                else {
                    el.innerHTML = Math.round(currentVal).toString();
                }
                if (currentFrame < totalFrames) {
                    requestAnimationFrame(updateCounter);
                }
                else {
                    el.innerHTML = isDecimal ? target.toFixed(1) : target.toString();
                }
            };
            updateCounter();
        });
        // Hero Mock Progress Bar
        const confidenceBar = document.getElementById('mockConfidenceBar');
        if (confidenceBar) {
            setTimeout(() => {
                confidenceBar.style.width = '92.4%';
            }, 300);
        }
    };
    // Run hero counters immediately
    setTimeout(runAnimatedCounters, 500);
    // 2. Scroll Animations (Fade-In-Up)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('visible');
                // If it contains numbers to animate, trigger them now
                const innerCounters = el.querySelectorAll('.animate-number');
                if (innerCounters.length > 0) {
                    innerCounters.forEach(counter => {
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
                }
                observer.unobserve(el);
            }
        });
    }, observerOptions);
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => fadeObserver.observe(el));
});
