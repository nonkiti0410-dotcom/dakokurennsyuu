// 【要変更】あなたのLIFF IDとGASのウェブアプリURLを設定してください
const LIFF_ID = '2010370033-cbKqlKWK'; 
const GAS_URL = 'https://script.google.com/macros/s/AKfycby--8nHRymErPUy4ub2TS94KaDRBrQwEiPLNIKK1059m8z-FY2hQ-4BeSo__xcV2Is88Q/exec';

let userId = '';
let userName = '';

// LIFF初期化
document.addEventListener('DOMContentLoaded', () => {
    liff.init({ liffId: LIFF_ID })
        .then(() => {
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                initializeApp();
            }
        })
        .catch((err) => {
            console.error('LIFF初期化失敗', err);
            document.getElementById('status-text').innerText = 'LIFFの初期化に失敗しました。';
        });
});

// アプリ起動時の処理（プロフィール取得など）
function initializeApp() {
    liff.getProfile()
        .then(profile => {
            userId = profile.userId;
            userName = profile.displayName;
            document.getElementById('user-name').innerText = userName;
            
            // ログインに成功したら打刻ボタンを有効化
            document.getElementById('btn-submit').disabled = false;
            document.getElementById('status-text').innerText = '打刻ボタンを押すと位置情報を取得します。';
        })
        .catch(err => {
            console.error('プロフィール取得失敗', err);
        });
}

// ボタンクリックイベント
document.getElementById('btn-submit').addEventListener('click', () => {
    const statusText = document.getElementById('status-text');
    statusText.innerText = '位置情報を取得中...';
    document.getElementById('btn-submit').disabled = true;

    // GPS位置情報の取得
    if (!navigator.geolocation) {
        statusText.innerText = 'お使いの端末は位置情報に対応していません。';
        document.getElementById('btn-submit').disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            statusText.innerText = `位置情報取得完了。データを送信中...`;

            // GASへデータを送信
            sendToGAS(latitude, longitude);
        },
        (error) => {
            console.error('位置情報取得エラー', error);
            statusText.innerText = '位置情報の取得に失敗しました。設定を確認してください。';
            document.getElementById('btn-submit').disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});

// GASへのPOST送信
function sendToGAS(lat, lng) {
    const statusText = document.getElementById('status-text');
    
    const payload = {
        userId: userId,
        userName: userName,
        latitude: lat,
        longitude: lng
    };

    fetch(GAS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            statusText.innerText = '打刻が完了しました！画面を閉じてください。';
            // 数秒後にLIFFを自動で閉じる
            setTimeout(() => { liff.closeWindow(); }, 2000);
        } else {
            statusText.innerText = 'エラー: ' + data.message;
            document.getElementById('btn-submit').disabled = false;
        }
    })
    .catch(error => {
        console.error('GAS送信エラー', error);
        statusText.innerText = '通信エラーが発生しました。';
        document.getElementById('btn-submit').disabled = false;
    });
}