// Firebase 초기화
window.firebaseConfig = {
    apiKey: "AIzaSyDFyoSOXpF32S9HHENuJ_Ogr7bW50LG2wE",
    authDomain: "farm-server-f0f8c.firebaseapp.com",
    databaseURL: "https://farm-server-f0f8c-default-rtdb.firebaseio.com",
    projectId: "farm-server-f0f8c",
    storageBucket: "farm-server-f0f8c.appspot.com",
    appId: "1:872192710214:web:6587f7631ba7cdde36dc47"
};

// Firebase 초기화
const app = firebase.initializeApp(window.firebaseConfig);
const db = firebase.database();
const cherryTomatoRef = db.ref('/cherry_tomato');

// DOM 요소
const elements = {
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    ec: document.getElementById('ec'),
    ph: document.getElementById('ph'),
    pumpStatus: document.getElementById('pump-status'),
    cameraImage: document.getElementById('cameraImage'),
    photoTime: document.getElementById('photoTime'),
    captureBtn: document.getElementById('captureBtn'),
    lastUpdate: document.getElementById('lastUpdate'),
    alertBox: document.getElementById('alertBox'),
    photoStatus: document.getElementById('photoStatus'),
    connectionStatus: document.getElementById('connectionStatus'),
    growthStage: document.getElementById('growthStage')
};

// 차트 초기화
const tempHumChart = new Chart(document.getElementById('tempHumChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '온도 (°C)',
            borderColor: '#e74c3c',
            data: [],
            yAxisID: 'y'
        }, {
            label: '습도 (%)',
            borderColor: '#3498db',
            data: [],
            yAxisID: 'y1'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: '온도 (°C)'
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                title: {
                    display: true,
                    text: '습도 (%)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    }
});

const ecPhChart = new Chart(document.getElementById('ecPhChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'EC (us/cm)',
            borderColor: '#2ecc71',
            data: [],
            yAxisID: 'y'
        }, {
            label: 'pH',
            borderColor: '#9b59b6',
            data: [],
            yAxisID: 'y1'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'EC (us/cm)'
                }
            },
            y1: {
                type: 'linear',
                position: 'right',
                title: {
                    display: true,
                    text: 'pH'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    }
});

// 센서 데이터 업데이트
function updateSensorUI(data) {
    if (!data) return;
    
    // 각 센서 값 업데이트
    updateCard('temperature', data.TEMP, '°C', '#FF9F43', 0, 50);
    updateCard('humidity', data.HUM, '%', '#45B7D1', 0, 100);
    updateCard('ec', data.EC, 'us/cm', '#4caf50', 0, 5);
    updateCard('ph', data.PH, 'pH', '#ab47bc', 0, 14);
    
    // 펌프 상태 업데이트
    elements.pumpStatus.textContent = data.PUMP_STATUS || '--';
    
    // 마지막 업데이트 시간
    elements.lastUpdate.textContent = new Date().toLocaleTimeString();
}

// 카드 업데이트 함수
function updateCard(id, value, unit, color, min, max) {
    const card = document.getElementById(id);
    if (!card) return;
    
    const valueElement = card.querySelector('.value');
    if (valueElement) {
        valueElement.textContent = value !== undefined ? value.toFixed(1) : '--';
        valueElement.style.opacity = 0;
        setTimeout(() => valueElement.style.opacity = 1, 100);
    }
    
    const unitElement = card.querySelector('.unit');
    if (unitElement) unitElement.textContent = unit || '';
    
    const gauge = card.querySelector('.gauge-fill');
    if (gauge && value !== undefined) {
        const percent = ((value - min) / (max - min)) * 100;
        gauge.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
        gauge.style.backgroundColor = color;
    }
}

// 사진 촬영 함수
async function takePhoto() {
    elements.captureBtn.disabled = true;
    elements.captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 촬영 중...';
    elements.photoStatus.textContent = "카메라 준비 중...";
    elements.photoStatus.style.color = "#3498db";

    try {
        await cherryTomatoRef.child('capture_request').set({ requested: true });
        
        const photoStatusRef = cherryTomatoRef.child('photo_status');
        const listener = photoStatusRef.on('value', (snapshot) => {
            const status = snapshot.val();
            if (status) {
                if (status === "success") {
                    showAlert('사진 촬영 및 업로드 성공!', 'success');
                    elements.photoStatus.textContent = "최근 촬영: 성공";
                    elements.photoStatus.style.color = "#00b894";
                } else if (status === "failed") {
                    showAlert('사진 촬영 실패!', 'error');
                    elements.photoStatus.textContent = "최근 촬영: 실패";
                    elements.photoStatus.style.color = "#d63031";
                }
                photoStatusRef.off('value', listener);
                cherryTomatoRef.child('photo_status').set(null);
            }
        });
    } catch (error) {
        console.error("촬영 요청 오류:", error);
        showAlert('촬영 요청 실패: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            elements.captureBtn.disabled = false;
            elements.captureBtn.innerHTML = '<i class="fas fa-camera"></i> 사진 촬영';
        }, 3000);
    }
}

// 알림 표시 함수
function showAlert(message, type) {
    elements.alertBox.textContent = message;
    elements.alertBox.className = `alert ${type}`;
    elements.alertBox.style.display = 'block';
    setTimeout(() => {
        elements.alertBox.style.display = 'none';
    }, 3000);
}

// Firebase 리스너 설정
cherryTomatoRef.child('sensor_data').limitToLast(1).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const latestData = Object.values(data)[0];
        updateSensorUI(latestData);
    }
});

cherryTomatoRef.child('system_status').on('value', (snapshot) => {
    const status = snapshot.val();
    if (status) {
        elements.growthStage.textContent = status.growth_stage || '-';
    }
});

cherryTomatoRef.child('latest_image').on('value', (snapshot) => {
    const imageData = snapshot.val();
    if (imageData) {
        elements.cameraImage.src = imageData.url;
        elements.cameraImage.style.display = 'block';
        elements.photoTime.textContent = `촬영 시간: ${imageData.timestamp}`;
    }
});

// 이벤트 리스너 설정
elements.captureBtn.addEventListener('click', takePhoto);

// 연결 상태 모니터링
cherryTomatoRef.child('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        elements.connectionStatus.textContent = '연결됨';
        elements.connectionStatus.style.color = '#00b894';
    } else {
        elements.connectionStatus.textContent = '연결 끊김';
        elements.connectionStatus.style.color = '#d63031';
    }
});

// 데이터 업데이트 함수
function updateData() {
    fetch('/get_sensor_data')
        .then(response => response.json())
        .then(data => {
            // 센서 값 업데이트
            document.getElementById('temperature').textContent = data.temperature.toFixed(1);
            document.getElementById('humidity').textContent = data.humidity.toFixed(1);
            document.getElementById('ec').textContent = data.ec.toFixed(1);
            document.getElementById('ph').textContent = data.ph.toFixed(1);

            // 모터 상태 업데이트
            const pumpStatus = document.getElementById('pumpStatus');
            pumpStatus.textContent = data.pump_status ? 'ON' : 'OFF';
            pumpStatus.className = 'pump-status ' + (data.pump_status ? 'pump-on' : 'pump-off');

            // 차트 데이터 업데이트
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            
            // 온도/습도 차트 업데이트
            tempHumChart.data.labels.push(timestamp);
            tempHumChart.data.datasets[0].data.push(data.temperature);
            tempHumChart.data.datasets[1].data.push(data.humidity);
            if (tempHumChart.data.labels.length > 20) {
                tempHumChart.data.labels.shift();
                tempHumChart.data.datasets[0].data.shift();
                tempHumChart.data.datasets[1].data.shift();
            }
            tempHumChart.update();

            // EC/pH 차트 업데이트
            ecPhChart.data.labels.push(timestamp);
            ecPhChart.data.datasets[0].data.push(data.ec);
            ecPhChart.data.datasets[1].data.push(data.ph);
            if (ecPhChart.data.labels.length > 20) {
                ecPhChart.data.labels.shift();
                ecPhChart.data.datasets[0].data.shift();
                ecPhChart.data.datasets[1].data.shift();
            }
            ecPhChart.update();

            // 마지막 업데이트 시간 표시
            document.getElementById('lastUpdate').textContent = 
                '마지막 업데이트: ' + new Date(data.timestamp).toLocaleString();
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('데이터 업데이트 실패', 'error');
        });
}

// 모터 제어 함수
function togglePump() {
    fetch('/toggle_pump', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateData();
                showAlert('모터 상태가 변경되었습니다', 'success');
            } else {
                showAlert('모터 제어 실패', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('모터 제어 실패', 'error');
        });
}

// 주기적으로 데이터 업데이트
setInterval(updateData, 5000);
updateData(); // 초기 데이터 로드 