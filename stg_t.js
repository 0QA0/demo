// ★起動時の処理
function setup(){
    canvasSize(1200,720);
    loadImg(0,"image/bg.png");          // 画像の読み込み：背景
    loadImg(1,"image/spaceship.png");   // 画像の読み込み：自機
    loadImg(2,"image/missile.png");     // 画像の読み込み：自機弾
    loadImg(3,"image/explode.png");     // 画像の読み込み：爆発エフェクト
    for(var i=0; i<=4; i++) loadImg(4+i, "image/enemy"+i+".png");    // 画像の読み込み：敵
    for(var i=0; i<=2; i++) loadImg(9+i, "image/item"+i+".png");    // 画像の読み込み：アイテム
    loadImg(12, "image/laser.png");
    loadSound(0, "sound/bgm.m4a");
    initSShip();
    initMissile();
    initObject();
    initEffect();
}

// ★メインループ
var idx = 0;
var tmr = 0;
var score = 0;
var hisco = 0;
function mainloop(){
    tmr++;              // タイマーカウント
    drawBG(1);          // 背景をスクロール表示する関数
    switch(idx){

        // タイトル画面の処理
        case 0:
            drawImg(13, 200, 200);
            if(tmr%40 < 20) fText("Press [SPC] or Click to start.", 600, 540, 40, "cyan");

            if(key[32] >0 || tapC >0){
                initSShip();
                initObject();
                score = 0;
                stage = 1;
                idx = 1;
                tmr = 0;
                playBgm(0);
            }
            break;

        // インゲームの処理
        case 1:
            moveSShip();        // 自機を移動させる関数
            moveMissile();      // 自機弾を移動させる関数
            setEnemy();         // 敵を出現させる関数
            moveObject();       // 敵を移動させる関数
            setItem();          // アイテムを出現させる関数
            drawEffect();       // エフェクトを発生させる関数
            for(i=0; i<10; i++) fRect(20+i*30, 660, 20, 40, "#c00000"); // 赤い枠を10個出現させる
            for(i=0; i<energy; i++) fRect(20+i*30, 660, 20, 40, colorRGB(160-16*i, 240-12*i, 24*i));    // エネルギーの残量を描画
            if(tmr < 30*4) fText("STAGE " + stage, 600, 300, 50, "cyan");
            if(30*114 < tmr && tmr < 30*118) fText("STAGE CLEAR!", 600, 300, 50, "cyan");
            if(tmr == 30*120){
                stage++;
                tmr = 0;
            }
            break;

        // ゲームオーバーの処理
        case 2:
        if(tmr < 30*2 && tmr%5 == 1) setEffect(ssX + rnd(120)-60, ssY + rnd(80)-40, 9);
        moveMissile();
        moveObject();
        drawEffect();
        fText("GAME OVER", 600, 300, 50, "red");
        if(tmr > 30*5) idx = 0;
        break;
    }
    fText("SCORE " + score, 200, 50, 40, "white");                      // スコア表示
    fText("HISCORE " + hisco, 600, 50, 40, "yellow");   // ハイスコア表示
    
}

// 背景のスクロール
var bgX = 0;    // 引数の宣言、初期値代入
function drawBG(spd){
    bgX = (bgX + spd)%1200;
    drawImg(0,-bgX,0);  // 背景１の描画
    drawImg(0,1200-bgX,0);  // 背景２の描画

    // 立体的な地面を描くコード
    var hy = 580;
    var ofsx = bgX%40;
    lineW(2);
    for(var i=1; i<=30; i++){
        var tx = i*40 - ofsx;
        var bx = i*240 - ofsx*6 - 3000;
        line(tx, hy, bx, 720, "silver");
    }
    for(var i=1; i<12; i++){
        lineW(1 + int(i/3));
        line(0, hy, 1200, hy, "gray");
        hy = hy + i*2;
    }
}

// 自機の管理
var ssX = 0;
var ssY = 0;
var automa = 0;         // 弾の自動発射の変数

function initSShip(){   // 自機の初期状態
    ssX = 400;
    ssY = 360;
    energy = 10;
    muteki = 0;
}

function moveSShip(){
    if(key[37] > 0 && ssX > 60) ssX -= 20;
    if(key[39] > 0 && ssX < 1000) ssX +=20;
    if(key[38] > 0 && ssY > 40) ssY -=20;
    if(key[40] > 0 && ssY < 680) ssY +=20;
    if(key[65] == 1){                       // 「A」キーが押されたら
        key[65]++;
        automa = 1-automa;                  // 自動発射のON／OFFを切り替える
    }
    if(automa == 0 && key[32] == 1){                            // 「自動発射OFF」かつ「スペースキー押下」で弾発射
        key[32]++;
        setWeapon();
    } 
    if(automa == 1 && tmr%8 == 0) setWeapon();  // 「自動発射ON」かつ「tmr%8=0」で弾発射
    var col = "black";
    if(automa == 1) col = "white";
    fRect(900,20,280,60,"blue");
    fText("[A]uto Missile", 1040,50,36, col);

    if(tapC > 0){                                           // 画面タップ時
        if(900<tapX && tapX<1180 && 20<tapY && tapY<80){    // Auto Missile の位置ならば
            tapC = 0;                                       // （タップ入力を解除して）
            automa = 1 - automa;                            // 自動発射の ON/OFF を切り替える
        }
        else{                                               // 画面タップ時
            ssX = ssX + int((tapX-ssX)/6);                  // Auto Missile 以外の位置ならば
            ssY = ssY + int((tapY-ssY)/6);                  // タップした位置に自機を移動させる
        }
    }

    if(muteki%2 == 0 ) drawImgC(1,ssX,ssY);    // 無敵時の自機点滅(muteki=無敵時間)
    if(muteki > 0) muteki--;    // 無敵時間を減らす
}

// 複数の自機弾を管理する配列
var MSL_MAX = 100;              // 最大いくつの弾が生成されるかを指定
var mslX = new Array(MSL_MAX);
var mslY = new Array(MSL_MAX);
var mslXp = new Array(MSL_MAX);
var mslYp = new Array(MSL_MAX);
var mslF = new Array(MSL_MAX);
var mslImg = new Array(MSL_MAX);
var laser = 0;
var weapon = 0;
var mslNum = 0;

function initMissile(){                             // 配列を初期化
    for(var i=0; i<MSL_MAX; i++) mslF[i] = false;   // 最大数までの自機弾を初期化
    mslNum = 0;
}

// 弾の発射関数（複数ver）
function setMissile(x,y,xp,yp){
    mslX[mslNum] = x;
    mslY[mslNum] = y;
    mslXp[mslNum] = xp;
    mslYp[mslNum] = yp;
    mslF[mslNum] = true;
    mslImg[mslNum] = 2;         // 通常弾の番号を配列に代入
    if(laser > 0) {             // レーザーが撃てるなら
        laser--;                // レーザーの数を１減らす
        mslImg[mslNum] = 12;    // レーザーの画像番号を配列に代入
    }
    mslNum = (mslNum+1)%MSL_MAX;
}

// 弾の移動関数（複数ver）
function moveMissile(){
    for(var i=0; i<MSL_MAX; i++){
        if(mslF[i] == true){
            mslX[i] += mslXp[i];
            mslY[i] += mslYp[i];
            drawImgC(mslImg[i],mslX[i],mslY[i]);
            if(mslX[i] > 1200) mslF[i] = false;
        }
    }
}

// 自機弾：複数の弾を一度に放つ関数
function setWeapon(){
    var n = weapon;
    if(n > 8) n = 8;    // 弾の最大発射数
    for(var i=0; i<=n; i++) setMissile(ssX+40, ssY-n*6+i*12, 40, int((i-n/2)*2));
}

// 敵を管理する配列
var OBJ_MAX = 100;                  // 最大いくつの敵が出現するかを指定
var objType = new Array(OBJ_MAX);   // ０：敵弾、１：敵、２：アイテム
var objImg = new Array(OBJ_MAX); 
var objX = new Array(OBJ_MAX);
var objY = new Array(OBJ_MAX);
var objXp = new Array(OBJ_MAX);
var objYp = new Array(OBJ_MAX);
var objLife = new Array(OBJ_MAX);
var objF = new Array(OBJ_MAX);  // 敵の出現ON／OFFフラグ
var objNum = 0;

function initObject(){                              // 配列を初期化
    for(var i=0; i<OBJ_MAX; i++) objF[i] = false;
    objNum = 0;
}

// 敵をセットする関数
function setObject(typ,png,x,y,xp,yp,lif){
    objType[objNum] = typ;
    objImg[objNum] = png;
    objX[objNum] = x;
    objY[objNum] = y;
    objXp[objNum] = xp;
    objYp[objNum] = yp;
    objLife[objNum] = lif;
    objF[objNum] = true;
    objNum = (objNum+1)%OBJ_MAX;
}

// 敵を動かす関数
function moveObject(){
    for(var i=0; i<OBJ_MAX; i++){
        if(objF[i] == true){
            objX[i] = objX[i] + objXp[i];
            objY[i] = objY[i] + objYp[i];

            //敵２の特殊な動き
            if(objImg[i] == 6){
                if(objY[i]<60) objYp[i] = 8;
                if(objY[i]>660) objYp[i] = -8;
            }

            //敵３の特殊な動き
            if(objImg[i] == 7){
                if(objXp[i]<0){
                    objXp[i] = int(objXp[i]*0.95);
                    if(objXp[i] == 0){
                        setObject(0,4,objX[i],objY[i],-20,0,0); // 弾を撃つ
                        objXp[i] = 20;
                    }
                }
            }

            drawImgC(objImg[i],objX[i],objY[i]);
            if(objType[i] == 1 && rnd(100) < 3) setObject(0,4,objX[i],objY[i],-24,0);
            if(objX[i]<0) objF[i] = false;

            // 自機弾とのヒット処理
            if(objType[i] == 1){
                var r = 12+(img[objImg[i]].width+img[objImg[i]].height)/4;
                for(var n=0; n<MSL_MAX; n++){
                    if(mslF[n] == true){
                        if(getDis(objX[i], objY[i], mslX[n], mslY[n]) < r){
                            if(mslImg[n] == 2) mslF[n] = false; // 自機弾が通常弾であれば消滅させる
                                objLife[i]--;
                            if(objLife[i] == 0){
                                objF[i] = false;
                                setEffect(objX[i], objY[i], 9); // 耐久力が無くなったときの、敵の爆発エフェクト
                            }
                            else{
                                setEffect(objX[i], objY[i], 3); // 耐久力が無くならなかったときの、敵の簡素な爆発エフェクト
                            }
                        }
                    }
                }
            }

            // 自機とのヒット処理
            var r = 30 + (img[objImg[i]].width + img[objImg[i]].height)/4; // 自機のヒットチェックの範囲を求める（自機：３０ドットの半径の円としている）
            if(getDis(objX[i], objY[i], ssX, ssY) < r){     // 敵と自機間の距離を求める

                if(objType[i] <= 1 && muteki ==0){    // ヒットしたのが敵／敵弾のとき
                    objF[i] = false;                  // １）ヒットした敵／敵弾を消滅させる
                    energy--;                         // ２）自機のエネルギーを減らす
                    if(energy <= 0){
                        idx = 2;
                        tmr = 0;
                    }
                    else{
                        muteki = 30;                      // ３）一定時間、自機を無敵状態にする
                    }
                }

                if(objType[i] == 2){                            // ヒットしたのがアイテムの場合
                    objF[i] = false;                            // ヒットしたアイテムを消滅
                    if(objImg[i] == 9 && energy <10) energy++;  // エネルギー回復アイテムならば、エネルギー回復
                    if(objImg[i] == 10) weapon++;               // 弾数強化アイテムならば、弾数アップ
                    if(objImg[i] == 11) laser = laser + 100;    // レーザー装備アイテムならば、レーザー装備
                }
            }
            if(objX[i]<-100 || objX[i]>1300 || objY[i]<-100 || objY[i]>820) objF[i] = false;
        }
    }
}

// 敵を出現させる関数
function setEnemy(){
    var sec = int(tmr/30);
    if( 4 <= sec && sec < 10) {
        if(tmr%20 == 0){
            setObject(1,5,1300, 60+rnd(600), -16, 0, 1*stage);  // 敵１を出現させる
        }
    }
    if(14 <= sec && sec < 20) {
        if(tmr%20 == 0){
             setObject(1,6,1300, 60+rnd(600), -12, 8, 3*stage);  // 敵２を出現させる
        }
    }
    if(24 <= sec && sec < 30) {
        if(tmr%20 == 0){
             setObject(1,7,1300, 360+rnd(300), -48, -10, 5*stage);  // 敵３を出現させる
        }
    }
    if(34 <= sec && sec < 50) {
        if(tmr%20 == 0){
             setObject(1,8,1300, rnd(720-192), -6, 0, 0);  // 障害物を出現させる
        }
    }
    if(54 <= sec && sec < 70) {
        if(tmr%20 == 0){
            setObject(1,5,1300, 60+rnd(600), -16,  4, 1*stage);
            setObject(1,5,1300,360+rnd(600), -16, -4, 1*stage);
        }
    }
    if(74 <= sec && sec < 90) {
        if(tmr%20 == 0) setObject(1,6,1300, 60+rnd(600), -12, 8, 3*stage);
        if(tmr%45 == 0) setObject(1,8,1300, rnd(720-192), -8, 0, 0);
    }
    if(94 <= sec && sec < 110) {
        if(tmr%10 == 0) setObject(1,5,1300, 360, -24, rnd(11)-5, 1*stage);
        if(tmr%20 == 0) setObject(1,7,1300, rnd(300), -56, 4+rnd(12), 5*stage);           
    }
}

// アイテムを出現させる関数
function setItem(){
    if(tmr%90 ==  0) setObject(2,  9, 1300, 60+rnd(600), -10, 0, 0);    // エネルギー回復アイテム
    if(tmr%90 == 30) setObject(2, 10, 1300, 60+rnd(600), -10, 0, 0);    // 弾数強化アイテム
    if(tmr%90 == 60) setObject(2, 11, 1300, 60+rnd(600), -10, 0, 0);    // レーザー装備アイテム
}


// エフェクトの管理
var EFCT_MAX = 100;
var efctX = new Array(EFCT_MAX);
var efctY = new Array(EFCT_MAX);
var efctN = new Array(EFCT_MAX);
var efctNum = 0;

function initEffect(){
    for(var i=0; i<EFCT_MAX; i++) efctN[i] = 0;
    efctNum = 0;
}

function setEffect(x,y,n){
    efctX[efctNum] = x;
    efctY[efctNum] = y;
    efctN[efctNum] = n;             // エフェクトの絵の番号：９（最初）～１（最後）
    efctNum = (efctNum+1)%EFCT_MAX;
}

function drawEffect(){
    for(var i=0; i<EFCT_MAX; i++){
        if(efctN[i] > 0){
            drawImgTS(3, (9-efctN[i])*128, 0, 128, 128, efctX[i]-64, efctY[i]-64, 128, 128);
            efctN[i]--;
        }
    }
}