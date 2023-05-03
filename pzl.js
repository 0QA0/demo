// 起動時の処理
function setup(){
    canvasSize(960, 1200);
    loadImg(0, "image/bg.png");
    var BLOCK = ["tako", "wakame", "kurage", "sakana", "uni", "ika"];
    for(var i=0; i<6; i++) loadImg(1+i, "image/"+BLOCK[i]+".png");
    loadImg(7, "image/title.png");
    loadSound(0, "sound/bgm.m4a");
    loadSound(1, "sound/se.m4a");
    clrBlock();
}


// メインループ
function mainloop(){
    tmr++;
    drawPzl();
    drawEffect();
    switch(idx){

        // タイトル画面
        case 0:
            drawImgC(7, 480, 400);
            if (tmr%40<20) fText("TAP TO START.", 480, 680, 80, "pink");
            if (key[32]>0 || tapC>0){
                clrBlock();
                initVar();
                playBgm(0);
                idx = 1;
                tmr = 0;
            }
            break;

        // インゲーム
        case 1:
            if (procPzl() == 0){
                stopBgm();
                idx = 2;
                tmr = 0;
            }
            break;

        // ゲームオーバー
        case 2:
            fText("GAME OVER", 480, 420, 100, "violet");
            if (tmr>30*5) idx = 0;
            break;
    }
}

// ブロック用配列
var block = [1, 2, 3];  // 横に３つ並ぶブロックの各画像番号
var myBlockX;           // 横に３つ並ぶブロックの、中央のマスの位置ｘ
var myBlockY;           // 横に３つ並ぶブロックの、中央のマスの位置ｙ
var dropSpd;            // ブロックの落下速度

var gameProc = 0;       // 処理の流れを管理する変数
var gameTime = 0;       // 時間の進行を管理する変数

var idx = 0;
var score = 0;  // スコア
var rensa = 0;  // 連鎖回数
var points = 0; // ブロックを消した時の得点
var eftime = 0; // ブロックを消した時の演出時間
tmr = 0;
score = 0;
hisco = 5000;

var tapKey = [0, 0, 0, 0];  // ボタンアイコンのタップ判定用の配列


function initVar(){
    myBlockX = 4;       // ブロックの初期位置ｘ
    myBlockY = 1;       // ブロックの初期位置ｙ
    dropSpd = 90;       // ブロックの初期落下速度
}

/* ---------------------------
var masu = [
    [-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1, 0, 0, 0, 0, 0, 0, 0,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1],
];

var kesu = [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
-------------------------- */

var masu = new Array(13);
var kesu = new Array(13);
for (var y=0; y<13; y++){
    masu[y] = new Array(9);
    kesu[y] = new Array(9);
}

// 二次元配列を初期化する関数
function clrBlock(){
    var x, y;
    for(y=0; y<=12; y++){
        for(x=0; x<=8; x++){
            masu[y][x] = -1;    // マス全体を「ー１」で埋める
        }
    }
    for (y=1; y<=11; y++){
        for (x=1; x<=7; x++){
            masu[y][x] = 0;
            kesu[y][x] = 0;     // ブロックを配置するマスを「０」で埋める
        }
    }
}

// ゲームスタート時、各変数を初期化する関数
function initVar(){
    myBlockX = 4;
    myBlockY = 1;
    dropSpd = 90;

    block[0] = 1;
    block[1] = 2;
    block[2] = 3;

    block[3] = 2;
    block[4] = 3;
    block[5] = 4;

    gameProc = 0;
    gameTime = 30*60*3; // 制限時間：約３分
}

// ゲーム画面を描画する関数
function drawPzl(){
    var x, y;
    drawImg(0, 0, 0);            // 背景描画

    for (x=0; x<3; x++) drawImg(block[3+x], 672+80*x, 50);  // 次に落ちてくるブロックの表示
    fTextN("TIME\n" + gameTime, 800, 280, 70, 60, "white"); // タイム表示
    fTextN("SCORE\n" + score, 800, 560, 70, 60, "white");   // スコア表示
    fTextN("HI-SC\n" + hisco, 800, 840, 70, 60, "white");   // ハイスコア表示

    for(y=1; y<=11; y++){
        for(x=1; x<=7; x++){
            if(masu[y][x]>0) drawImgC(masu[y][x], 80*x, 80*y);  // マス内のブロックを描画
        }
    }
    
    if(gameProc == 0){
        for(x=-1; x<=1; x++) drawImgC(block[1+x], 80*(myBlockX+x), 80*myBlockY-2);  // 横に並んだ３つのブロックを描画
    }
    if(gameProc == 3){  // 消す処理
        fText(points + "pts", 320, 120, 50, RAINBOW[gameTime%8]);   // 得点
        if (extend>0) fText("TIME+" + extend + "!", 320, 240, 50, RAINBOW[tmr%8]);  // 増えたタイムを表示
    }
}

// ブロックを動かす関数
function procPzl(){
    var c, i, n, x, y;

    // 画面タップ操作
    if (tapC > 0 && 960 < tapY && tapY < 1200){     // ボタンのアイコンをタップ
        c = int(tapX / 240);                        // ボタンの番号を計算し、変数ｃに代入
        if (0 <= c && c <= 3) tapKey[c]++;
    }
    else{
        for(i=0; i<4; i++){
            tapKey[i] = 0;
        }
    }


    switch(gameProc){

        // ブロックの移動
    case 0:
        if (tmr<10) break;  // 下キーを押し続けたとき、ブロックが即座に落ちないように

        // キー操作
        if (key[37]==1 || key[37]>4){                        // 左キーが押されたとき
            key[37]++;
            if(masu[myBlockY][myBlockX-2] == 0) myBlockX--; // 左のマスが空いているなら座標を変更
        }

        if (key[39]==1 || key[39]>4){                        // 右キーが押されたとき
            key[39]++;
            if(masu[myBlockY][myBlockX+2] == 0) myBlockX++; // 右のマスが空いているなら座標を変更
        }

        if (key[32]==1 || key[32]>4){   // スペースキーが押されたとき、ブロックを入れ替える
            key[32]++;
            i = block[2];
            block[2] = block[1];
            block[1] = block[0];
            block[0] = i;
        }

        // タップ操作
        if (tapKey[0]==1 || tapKey[0]>8){                       // 左矢印アイコンのタップ
            if (masu[myBlockY][myBlockX-2] == 0) myBlockX--;
        }

        if (tapKey[2]==1 || tapKey[2]>8){                       // 右矢印アイコンのタップ
            if (masu[myBlockY][myBlockX+2] == 0) myBlockX++;
        }

        if (tapKey[3]==1 || tapKey[3]>8){                       // 入れ替えアイコンのタップ
            i = block[2];
            block[2] = block[1];
            block[1] = block[0];
            block[0] = i;
        }

        if(gameTime%dropSpd==0 || key[40]>0 || tapKey[1]>1){    // 一定時間ごと、あるいは下キー入力でブロックを落下させる
            if(masu[myBlockY+1][myBlockX-1] + masu[myBlockY+1][myBlockX] + masu[myBlockY+1][myBlockX+1] == 0){  // ブロックの下に何もなければ
                myBlockY ++;                                                                                    // 落下させる
            }
            else {                                      // ブロックをマス目に配置
                masu[myBlockY][myBlockX-1] = block[0];
                masu[myBlockY][myBlockX  ] = block[1];
                masu[myBlockY][myBlockX+1] = block[2];
                rensa = 1;  // 連鎖回数を１に
                gameProc = 1;
            }
        }
        break;
    
    // 移動し終えたブロックを下の空いているマスに落とす
    case 1:
        c=0;                        // 落下処理が残っているかどうか調べるフラグ
        for(y=10; y>=1; y--){
            for(x=1; x<=7; x++){
                if(masu[y][x]>0 && masu[y+1][x]==0){
                    masu[y+1][x] = masu[y][x];
                    masu[y][x] = 0;
                    c = 1;          // 落下処理があった場合ｃ＝１、落下処理がなかった場合ｃ＝０のまま
                }
            }
        }
        if(c == 0) gameProc = 2;    // すべての落下処理を終えると、次の処理へ
        break;

    // ブロックが揃ったかの判定
    case 2:
        for(y=1; y<=11; y++){
            for(x=1; x<=7; x++){
                c = masu[y][x];
                if(c>0){

                    // 縦に揃う
                    if(c==masu[y-1][x  ] && c==masu[y+1][x  ]){
                        kesu[y][x]=1; kesu[y-1][x  ]=1; kesu[y+1][x  ]=1;
                    }

                    // 横に揃う
                    if(c==masu[y  ][x-1] && c==masu[y  ][x+1]){
                        kesu[y][x]=1; kesu[y  ][x-1]=1; kesu[y  ][x+1]=1;
                    }
                    /*
                    // 右上／左下斜めに揃う
                    if(c==masu[y-1][x+1] && c==masu[y+1][x-1]){
                        kesu[y][x]=1; kesu[y-1][x+1]=1; kesu[y+1][x-1]=1;
                    }

                    // 左上／右下斜めに揃う
                    if(c==masu[y-1][x-1] && c==masu[y+1][x+1]){
                        kesu[y][x]=1; kesu[y-1][x-1]=1; kesu[y+1][x+1]=1;
                    }*/
                }
            }
        }

        // 揃ったブロックを数える
        n = 0;
        for(y=1; y<=11; y++){
            for(x=1; x<=7; x++){
                if(kesu[y][x] == 1){
                    n++;
                    setEffect(80*x, 80*y);
                }
            } 
        }

        
        
        // 揃った場合のスコア計算
        if(n>0){
            playSE(1);
            if(rensa == 1 && dropSpd > 5) dropSpd--;    // 消すごとに落下速度が増す
            points = 50*n*rensa;    // 基本点は消したブロックの数×５０
            score += points;
            if (score>hisco) hisco = score;
            extend = 0;
            if (n%5==0) extend = 300;   // ５個の倍数のブロックを消すと、タイムを加算
            gameTime += extend;
            rensa = rensa*2;    // 連鎖した時、得点が倍々に増える
            eftime = 0; // ブロックを消す演出時間を管理する変数の値を０にする
            gameProc = 3;   // ブロックを消す処理へ
        }

        // 揃わなかった場合（次に落とすブロックをセット　→　次のブロックを落とす）
        else{
            myBlockX = 4;
            myBlockY = 1;
            if(masu[myBlockY][myBlockX-1]+masu[myBlockY][myBlockX]+masu[myBlockY][myBlockX+1] > 0) return 0;//ブロックが最上段にある
            block[0] = 1+rnd(4);
            block[1] = 1+rnd(4);
            block[2] = 1+rnd(4);
            gameProc = 0;
            tmr = 0;

            c = 4;  // ブロックの種類     
            if (score>10000) c = 5;
            if (score>20000) c = 6;
            block[3] = 1+rnd(c);    // 次のブロックを乱数で決定
            block[4] = 1+rnd(c);
            block[5] = 1+rnd(c);
            }
        break;

    // ブロックを消す処理
    case 3:
        eftime ++;
        if(eftime == 20){
            for(y=1; y<=11; y++){
                for(x=1; x<=7; x++){
                    if(kesu[y][x] == 1){
                        kesu[y][x] = 0;
                        masu[y][x] = 0;
                    }
                }
            }
            gameProc = 1;   // 落下処理へ
        } 
        break;
    }
    gameTime--;
    return gameTime;
}

// エフェクト関連
var RAINBOW = ["#ff0000", "#e0800", "#c0e000", "#00ff00", "#00c0e0", "#0040ff", "#8000e0"];
var EFF_MAX = 100;
var effX = new Array(EFF_MAX);
var effY = new Array(EFF_MAX);
var effT = new Array(EFF_MAX);
var effN = 0;
for(var i=0; i<EFF_MAX; i++) effT[i] = 0;

function setEffect(x, y){
    effX[effN] = x;
    effY[effN] = y;
    effT[effN] = 20;
    effN = (effN+1)%EFF_MAX;
}

function drawEffect(){
    lineW(20);  // 線の太さを指定する関数
    for(var i=0; i<EFF_MAX; i++){
        if(effT[i] > 0){
            setAlp(effT[i]*5);
            sCir(effX[i], effY[i], 110-effT[i]*5, RAINBOW[(effT[i]+0)%8]);  // 円を描く命令でエフェクトを表現
            sCir(effX[i], effY[i],  90-effT[i]*4, RAINBOW[(effT[i]+0)%8]);
            sCir(effX[i], effY[i],  70-effT[i]*3, RAINBOW[(effT[i]+0)%8]);
            effT[i]--;
        }
    }
    setAlp(100);
    lineW(1);
}
    