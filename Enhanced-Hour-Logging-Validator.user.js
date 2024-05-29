// ==UserScript==
// @name         Enhanced Hour Logging Validator
// @namespace    https://github.com/DennisGHUA/Enhanced-Hour-Logging-Validator
// @version      0.1
// @description  Prevent errors in hour logging by highlighting discrepancies
// @author       Dennis
// @match        https://www.myatos.net/*
// @grant        none
// @downloadURL
// @updateURL
// ==/UserScript==

(function() {
    'use strict';

    // Constants for color codes
    const COLORS = {
        BAD: '#DC143C',  // red
        WARN: '#FFA500', // yellow
        GOOD: '#228B22'  // green
    };

    // Initial state
    let state = COLORS.GOOD;

    // Function to worsen the state based on color
    function worsenState(newState) {
        const stateOrder = {
            [COLORS.GOOD]: 1,
            [COLORS.WARN]: 2,
            [COLORS.BAD]: 3
        };

        if (stateOrder[newState] > stateOrder[state]) {
            state = newState;
        }
    }

    // Function to create a banner at the bottom
    function createBanner(message) {
        let banner = document.getElementById('errorBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'errorBanner';
            banner.style.position = 'fixed';
            banner.style.bottom = '0';
            banner.style.width = '100%';
            banner.style.backgroundColor = COLORS.BAD;
            banner.style.color = 'white';
            banner.style.padding = '10px';
            banner.style.textAlign = 'center';
            document.body.appendChild(banner);
        }
        banner.textContent = message;
        changeReleaseButtonColor(COLORS.WARN);
    }

    // Function to remove the banner
    function removeBanner() {
        const banner = document.getElementById('errorBanner');
        if (banner) {
            banner.parentNode.removeChild(banner);
        }
    }

    // Function to change text color and decoration
    function handleTextColor(span, color, textDecoration) {
        span.style.color = color;
        span.style.textDecoration = textDecoration;
    }

    // Function to highlight text discrepancies
    function highlightText() {
        let hasError = false;
        const spans = document.querySelectorAll('.MuiGrid-root .MuiGrid-item .MuiGrid-grid-xs-1');

        spans.forEach(span => {
            try {
                const [left, right] = span.textContent.split('/');
                const leftValue = parseFloat(left.replace(',', '.'));
                const rightValue = parseFloat(right.replace(',', '.'));

                if (isNaN(leftValue) || isNaN(rightValue)) {
                    return; // Skip to the next iteration of the loop
                }

                let color = '';

                if (leftValue == rightValue && rightValue == 0.00) {
                    handleTextColor(span, COLORS.GOOD, 'line-through');
                } else if (leftValue > rightValue) {
                    color = COLORS.BAD;
                    hasError = true;
                    handleTextColor(span, color, 'none');
                } else if (leftValue === rightValue) {
                    color = COLORS.GOOD;
                    handleTextColor(span, color, 'none');
                } else {
                    color = COLORS.WARN;
                    handleTextColor(span, color, 'none');
                }

                const childSpans = span.querySelectorAll('span');
                childSpans.forEach(childSpan => {
                    handleTextColor(childSpan, color, 'none');
                });

                worsenState(color);
            } catch (error) {
                // Handle the error here
            }
        });

        if (!hasError) {
            removeBanner();
        } else {
            createBanner('Caution: the hours deviate from the intended goal.');
        }
    }

    // Function to change the color of buttons
    function changeButtonColor(color) {
        worsenState(color);
        const buttons = document.querySelectorAll('button span');
        buttons.forEach(button => {
            const buttonText = button.textContent;
            if (buttonText.includes("Release Week") || buttonText.includes("Release Until") || buttonText.includes("Rel.Until")) {
                const buttonElement = button.parentNode;
                if (buttonElement.getAttribute('aria-disabled') === 'true') {
                    console.log("The button is greyed out (disabled).");
                } else {
                    buttonElement.style.backgroundColor = state;
                }
            }
        });
        changeProgressBarColor();
    }

    // Function to change the color of progress bars
    function changeProgressBarColor() {
        const progressBars = document.querySelectorAll('.MuiLinearProgress-bar');
        progressBars.forEach(progressBar => {
            if (progressBar) {
                progressBar.style.backgroundColor = state;
            }
        });
    }

    // Function to highlight total text discrepancies
    function highlightTextTotal() {
        const spans = document.querySelectorAll('.MuiGrid-root span.jss223.jss230');

        spans.forEach(span => {
            const [left, right] = span.textContent.split('/');
            const leftValue = parseFloat(left.replace(',', '.'));
            const rightValue = parseFloat(right.replace(',', '.'));

            if (leftValue > rightValue) {
                handleTextColor(span, COLORS.BAD, 'none');
                changeButtonColor(COLORS.BAD);
            } else if (leftValue === rightValue) {
                handleTextColor(span, COLORS.GOOD, 'none');
                changeButtonColor(COLORS.GOOD);
            } else {
                handleTextColor(span, COLORS.WARN, 'none');
                changeButtonColor(COLORS.WARN);
            }

            worsenState(span.style.color);
        });
    }

    // Function to observe DOM changes
    function observeDOMChanges() {
        console.log('Observing DOM changes...');
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    console.log('DOM mutation detected.');
                    const startTime = Date.now();
                    const checkClassesInterval = setInterval(() => {
                        if (document.querySelector('.MuiGrid-root') && document.querySelector('.MuiGrid-root span')) {
                            clearInterval(checkClassesInterval);
                            state = COLORS.GOOD; // Reset state to initial state
                            highlightText();
                            highlightTextTotal();
                            changeProgressBarColor();
                            changeButtonColor(state);
                        } else if (Date.now() - startTime > 30000) {
                            clearInterval(checkClassesInterval);
                            console.log('Classes not found after 30 seconds.');
                        }
                    }, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    observeDOMChanges();
})();
