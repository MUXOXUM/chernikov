        document.addEventListener('DOMContentLoaded', function() {
            const asciiContainer = document.getElementById('ascii-torus');
            
            // Элементы управления
            const r1Slider = document.getElementById('r1-slider');
            const r2Slider = document.getElementById('r2-slider');
            const k1Slider = document.getElementById('k1-slider');
            const k2Slider = document.getElementById('k2-slider');
            const speedSlider = document.getElementById('speed-slider');
            const resolutionSlider = document.getElementById('resolution-slider');
            const resetButton = document.getElementById('reset-button');
            
            const r1Value = document.getElementById('r1-value');
            const r2Value = document.getElementById('r2-value');
            const k1Value = document.getElementById('k1-value');
            const k2Value = document.getElementById('k2-value');
            const speedValue = document.getElementById('speed-value');
            const resolutionValue = document.getElementById('resolution-value');
            
            // Размеры контейнера для отображения
            const width = 120;
            const height = 60;
            
            // Параметры тора
            let R1 = parseFloat(r1Slider.value);  // Толщина трубки тора
            let R2 = parseFloat(r2Slider.value);  // Размер тора
            let K1 = parseFloat(k1Slider.value);  // Масштаб (отдельный параметр)
            let K2 = parseFloat(k2Slider.value);  // Расстояние от наблюдателя
            let speedFactor = parseInt(speedSlider.value) * 15; // Скорость анимации (1-10) * 15
            let resolution = parseFloat(resolutionSlider.value); // Разрешение
            
            // ASCII символы для отрисовки (от темного к светлому)
            const chars = ".,-~:;=!*#$@";
            
            // Буферы для хранения z-координат и символов
            const zBuffer = new Array(width * height).fill(0);
            const outputBuffer = new Array(width * height).fill(' ');
            
            let A = 0;  // Угол вращения вокруг оси X
            let B = 0;  // Угол вращения вокруг оси Z
            
            // Обновление значений на слайдерах
            function updateSliderValues() {
                r1Value.textContent = R1.toFixed(1);
                r2Value.textContent = R2.toFixed(1);
                k1Value.textContent = K1.toFixed(0);
                k2Value.textContent = K2.toFixed(0);
                speedValue.textContent = parseInt(speedSlider.value); // Отображаем исходное значение (1-10)
                resolutionValue.textContent = resolution.toFixed(3);
            }
            
            // Обработчики событий для слайдеров
            r1Slider.addEventListener('input', function() {
                R1 = parseFloat(this.value);
                updateSliderValues();
            });
            
            r2Slider.addEventListener('input', function() {
                R2 = parseFloat(this.value);
                updateSliderValues();
            });
            
            k1Slider.addEventListener('input', function() {
                K1 = parseFloat(this.value);
                updateSliderValues();
            });
            
            k2Slider.addEventListener('input', function() {
                K2 = parseFloat(this.value);
                updateSliderValues();
            });
            
            speedSlider.addEventListener('input', function() {
                speedFactor = parseInt(this.value) * 15; // Умножаем на 15 для реальной скорости
                updateSliderValues();
            });
            
            resolutionSlider.addEventListener('input', function() {
                resolution = parseFloat(this.value);
                updateSliderValues();
            });
            
            // Сброс параметров
            resetButton.addEventListener('click', function() {
                R1 = 0.8;
                R2 = 1.5;
                K1 = 100;
                K2 = 7;
                speedSlider.value = 10; // Устанавливаем значение 5 (середина диапазона)
                speedFactor = 10 * 15; // Умножаем на 15
                resolution = 0.015;
                
                r1Slider.value = R1;
                r2Slider.value = R2;
                k1Slider.value = K1;
                k2Slider.value = K2;
                resolutionSlider.value = resolution;
                
                updateSliderValues();
            });
            
            function renderFrame() {
                // Очищаем буферы
                zBuffer.fill(0);
                outputBuffer.fill(' ');
                
                // Вычисляем синусы и косинусы углов
                const cosA = Math.cos(A);
                const sinA = Math.sin(A);
                const cosB = Math.cos(B);
                const sinB = Math.sin(B);
                
                // Проходим по углам тора
                for (let theta = 0; theta < 2 * Math.PI; theta += 0.07) {
                    const cosTheta = Math.cos(theta);
                    const sinTheta = Math.sin(theta);
                    
                    // Используем настройку разрешения для угла phi
                    for (let phi = 0; phi < 2 * Math.PI; phi += resolution) {
                        const cosPhi = Math.cos(phi);
                        const sinPhi = Math.sin(phi);
                        
                        // Вычисляем координаты точки на торе
                        const circleX = R2 + R1 * cosTheta;
                        const circleY = R1 * sinTheta;
                        
                        // 3D вращение точки
                        const x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - circleY * cosA * sinB;
                        const y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + circleY * cosA * cosB;
                        const z = K2 + cosA * circleX * sinPhi + circleY * sinA;
                        
                        // Обратная z-координата для перспективы
                        const ooz = 1 / z;
                        
                        // Проецируем на 2D экран
                        const xp = Math.floor(width / 2 + K1 * ooz * x);
                        const yp = Math.floor(height / 2 - K1 * ooz * y);
                        
                        // Вычисляем освещение (нормаль к поверхности)
                        const L = cosPhi * cosTheta * sinB - cosA * cosTheta * sinPhi - sinA * sinTheta + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);
                        
                        if (L > 0 && xp >= 0 && xp < width && yp >= 0 && yp < height) {
                            const bufferIndex = yp * width + xp;
                            if (ooz > zBuffer[bufferIndex]) {
                                zBuffer[bufferIndex] = ooz;
                                const luminanceIndex = Math.floor(L * 8);
                                outputBuffer[bufferIndex] = chars[Math.min(luminanceIndex, chars.length - 1)];
                            }
                        }
                    }
                }
                
                // Формируем вывод
                let output = '';
                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < width; j++) {
                        output += outputBuffer[i * width + j];
                    }
                    output += '\n';
                }
                
                asciiContainer.textContent = output;
                
                // Обновляем углы анимации с учетом скорости
                A += 0.07 / (speedFactor / 10);
                B += 0.03 / (speedFactor / 10);
                
                requestAnimationFrame(renderFrame);
            }
            
            updateSliderValues();
            renderFrame();
        });