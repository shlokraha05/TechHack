class Viewer2D {
    constructor(containerId, canvasId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.walls = [];
        this.issues = [];
        
        // Handle resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    setImage(fileOrImage) {
        return new Promise((resolve, reject) => {
            if (fileOrImage instanceof HTMLImageElement) {
                this.image = fileOrImage;
                this.resize();
                resolve();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.image = img;
                    this.resize();
                    resolve();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileOrImage);
        });
    }

    setData(walls, issues) {
        this.walls = walls || [];
        this.issues = issues || [];
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.image) return;

        // Calculate aspect ratio fit
        const scaleX = this.canvas.width / this.image.width;
        const scaleY = this.canvas.height / this.image.height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of container

        const x = (this.canvas.width - this.image.width * scale) / 2;
        const y = (this.canvas.height - this.image.height * scale) / 2;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);

        // Draw original image clearly so it is visible side-by-side
        this.ctx.globalAlpha = 0.8;
        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.globalAlpha = 1.0;

        // Draw walls
        this.walls.forEach(wall => {
            // Check if this wall has an issue
            const hasIssue = this.issues.find(iss => iss.wallId === wall.id);
            
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            
            if (hasIssue) {
                this.ctx.strokeStyle = '#ef4444'; // struct-danger
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
                this.ctx.shadowBlur = 10;
            } else if (wall.type === 'load-bearing') {
                this.ctx.strokeStyle = '#6366f1'; // struct-primary
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
                this.ctx.shadowBlur = 8;
            } else {
                this.ctx.strokeStyle = '#8b5cf6'; // struct-accent
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.stroke();

            // Draw joints
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(wall.x1, wall.y1, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(wall.x2, wall.y2, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw ID label if there's an issue
            if (hasIssue) {
                this.ctx.fillStyle = '#ef4444';
                this.ctx.font = '12px Inter';
                this.ctx.fillText(`! Wall ${wall.id}`, wall.x1 + 10, wall.y1 - 10);
            }
        });

        this.ctx.restore();
    }
}
