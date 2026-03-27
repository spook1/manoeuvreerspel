import { input } from '../core/Input';

export class TouchUI {
    private container?: HTMLDivElement;
    private isTouchDevice: boolean;

    constructor() {
        // Detect touch capability
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        if (!this.isTouchDevice) {
            return; // Only init on mobile/touch devices
        }

        this.container = document.createElement('div');
        this.container.id = 'touch-ui-container';
        this.setupStyles();
        this.buildUI();
        document.body.appendChild(this.container);
    }

    private setupStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #touch-ui-container {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none; /* Let clicks pass through empty areas */
                z-index: 1000;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 20px;
            }
            .touch-controls-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                width: 100%;
            }
            /* Left side: steering */
            .touch-steer-group {
                display: flex;
                gap: 15px;
            }
            /* Right side: throttle */
            .touch-throttle-group {
                display: flex;
                flex-direction: row;
                gap: 10px;
            }
            /* Center: stop / line */
            .touch-center-group {
                display: flex;
                gap: 10px;
                /* Remove absolute positioning to prevent overlap on narrow screens */
            }
            
            .touch-btn {
                pointer-events: auto; /* Buttons are clickable */
                background: rgba(30, 41, 59, 0.6);
                border: 2px solid rgba(148, 163, 253, 0.4);
                border-radius: 12px;
                color: #e2e8f0;
                font-weight: bold;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                -webkit-user-select: none;
                backdrop-filter: blur(4px);
                transition: transform 0.05s, background 0.05s;
                touch-action: none; /* Prevent browser handling */
            }
                
            .touch-btn:active, .touch-btn.active {
                transform: scale(0.92);
                background: rgba(56, 189, 248, 0.6);
                border-color: rgba(56, 189, 248, 0.9);
            }

            .btn-steer { width: 72px; height: 72px; font-size: 28px; }
            .btn-throttle { width: 90px; height: 60px; font-size: 14px; text-align: center; }
            .btn-action { width: 64px; height: 64px; font-size: 24px; }

            @media (orientation: landscape) {
                #touch-ui-container {
                    padding: 30px 50px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private buildUI() {
        const row = document.createElement('div');
        row.className = 'touch-controls-row';

        // 1. STEERING (Left)
        const steerGroup = document.createElement('div');
        steerGroup.className = 'touch-steer-group';
        
        const btnLeft = this.createButton('◀', 'btn-steer', 'left');
        const btnRight = this.createButton('▶', 'btn-steer', 'right');
        
        steerGroup.appendChild(btnLeft);
        steerGroup.appendChild(btnRight);

        // 2. ACTION (Center)
        const centerGroup = document.createElement('div');
        centerGroup.className = 'touch-center-group';
        
        const btnLine = this.createButton('🪢', 'btn-action'); // Line logic later
        
        // Hide line button temporarily until phase 3
        btnLine.style.display = 'none';

        centerGroup.appendChild(btnLine);

        // 3. THROTTLE (Right)
        const throttleGroup = document.createElement('div');
        throttleGroup.className = 'touch-throttle-group';
        
        const btnUp = this.createButton('Meer<br>Gas', 'btn-throttle', 'up');
        const btnStop = this.createButton('Geen<br>Gas', 'btn-throttle', 'stop');
        const btnDown = this.createButton('Minder<br>Gas', 'btn-throttle', 'down');
        
        throttleGroup.appendChild(btnUp);
        throttleGroup.appendChild(btnStop);
        throttleGroup.appendChild(btnDown);

        row.appendChild(steerGroup);
        row.appendChild(centerGroup);
        row.appendChild(throttleGroup);

        this.container!.appendChild(row);

        // We only want to show TouchUI during gameplay mode
        this.container!.style.display = 'none';
    }

    private createButton(text: string, className: string, action?: 'up'|'down'|'left'|'right'|'stop'): HTMLDivElement {
        const btn = document.createElement('div');
        btn.className = `touch-btn ${className}`;
        btn.innerHTML = text;

        if (action) {
            let steerReleaseTimer: number | null = null;

            const release = () => {
                if (steerReleaseTimer !== null) {
                    clearTimeout(steerReleaseTimer);
                    steerReleaseTimer = null;
                }
                btn.classList.remove('active');
                if (action === 'left' || action === 'right') {
                    input.handleTouchUp(action);
                }
            };

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                // Capture pointer so pointerup always fires on this element
                // even if finger moves off-button quickly (e.g. double-tap)
                btn.setPointerCapture(e.pointerId);
                btn.classList.add('active');
                input.handleTouchDown(action);

                // Safety auto-release: if pointerup is somehow missed, clear after 600ms
                if (action === 'left' || action === 'right') {
                    if (steerReleaseTimer !== null) clearTimeout(steerReleaseTimer);
                    steerReleaseTimer = window.setTimeout(release, 600);
                }
            });

            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointercancel', release);
            // pointerleave is no longer needed since we capture the pointer
        }

        return btn;
    }

    public syncVisibility(gameMode: string) {
        if (!this.isTouchDevice) return;
        if (gameMode === 'game' || gameMode === 'practice') {
            this.container!.style.display = 'flex';
        } else {
            this.container!.style.display = 'none';
        }
    }
}

export const touchUI = new TouchUI();
