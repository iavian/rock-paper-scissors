const initialize = async () => {
    let webcam = document.getElementById('webcam');
    const knnClassifierModel = knnClassifier.create()
    const mobilenetModel = await mobilenet.load()
    const webcamInput = await tf.data.webcam(webcam)
    const rootImageURL = "https://iavian-varun.s3.ap-south-1.amazonaws.com/"

    const winnerMatrix = [
        [0, 1, -1],
        [-1, 0, 1],
        [1, -1, 0],
    ];
    const humanReadable = ['rock', 'paper', 'scissors']
    let mouseDownTimer = null
    document.getElementById('train-rock-button').addEventListener('mousedown', () => addDatasetClass("R"));
    document.getElementById('train-rock-button').addEventListener('mouseup', () => stopDatasetClass());
    document.getElementById('train-rock-button').addEventListener('mouseout', () => stopDatasetClass());
    document.getElementById('train-rock-button').addEventListener('touchstart', () => addDatasetClass("R"), false);
    document.getElementById('train-rock-button').addEventListener('touchend', () => stopDatasetClass(), false);
    document.getElementById('train-rock-button').addEventListener('touchcancel', () => stopDatasetClass(), false);

    document.getElementById('train-paper-button').addEventListener('mousedown', () => addDatasetClass("P"));
    document.getElementById('train-paper-button').addEventListener('mouseup', () => stopDatasetClass());
    document.getElementById('train-paper-button').addEventListener('mouseout', () => stopDatasetClass());
    document.getElementById('train-paper-button').addEventListener('touchstart', () => addDatasetClass("P"), false);
    document.getElementById('train-paper-button').addEventListener('touchend', () => stopDatasetClass(), false);
    document.getElementById('train-paper-button').addEventListener('touchcancel', () => stopDatasetClass(), false);

    document.getElementById('train-scissor-button').addEventListener('mousedown', () => addDatasetClass("S"));
    document.getElementById('train-scissor-button').addEventListener('mouseup', () => stopDatasetClass());
    document.getElementById('train-scissor-button').addEventListener('mouseout', () => stopDatasetClass());
    document.getElementById('train-scissor-button').addEventListener('touchstart', () => addDatasetClass("S"), false);
    document.getElementById('train-scissor-button').addEventListener('touchend', () => stopDatasetClass(), false);
    document.getElementById('train-scissor-button').addEventListener('touchcancel', () => stopDatasetClass(), false);

    document.getElementById('start-game-button').addEventListener('click', () => startAnimation());

    const addDatasetClass = async (classId) => {
        mouseDownTimer = setInterval(() => {
            _addDatasetClass(classId)
        }, 100)
    }

    const stopDatasetClass = async () => {
        if (mouseDownTimer) clearInterval(mouseDownTimer)
    }

    const _addDatasetClass = async (classId) => {
        const img = await webcamInput.capture();
        const activation = mobilenetModel.infer(img, 'conv_preds');
        knnClassifierModel.addExample(activation, classId);
        img.dispose();
        await updateFeedback()
    }

    const startAnimation = async () => {
        const uImage = document.getElementById('u-image');
        uImage.src = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png'
        const gameResult = document.getElementById('game-result')
        gameResult.classList.remove('win', 'loose', 'draw')
        gameResult.innerHTML = '&nbsp'
        const cImage = document.getElementById('c-image');
        let imageIndex = 0;
        const imageTimer = setInterval(() => {
            cImage.src = `https://iavian-varun.s3.ap-south-1.amazonaws.com/${humanReadable[imageIndex]}.svg`
            imageIndex++;
            if (imageIndex > 2) {
                imageIndex = 0
            }
        }, 100)

        setTimeout(async () => {
            clearInterval(imageTimer)
            await startGame()
        }, 2000)
    }

    const startGame = async () => {
        const computerChoice = Math.floor((Math.random() * 3));
        const cImage = document.getElementById('c-image');
        cImage.src = `https://iavian-varun.s3.ap-south-1.amazonaws.com/${humanReadable[computerChoice]}.svg`
        const img = await webcamInput.capture();
        const activation = mobilenetModel.infer(img, 'conv_preds');
        img.dispose();
        const result = await knnClassifierModel.predictClass(activation);
        const playerChoice = result.classIndex
        const playresult = winnerMatrix[playerChoice][computerChoice];
        const uImage = document.getElementById('u-image');
        uImage.src = `https://iavian-varun.s3.ap-south-1.amazonaws.com/${humanReadable[playerChoice]}.svg`
        const gameResult = document.getElementById('game-result')
        let humanReadableResult = "You Win 🏆"
        if (playresult == 1) {
            gameResult.classList.add('loose')
            humanReadableResult = "You Loose 😿"
        } else if (playresult == 0) {
            gameResult.classList.add('draw')
            humanReadableResult = "Draw"
        } else {
            gameResult.classList.add('win')
        }
        gameResult.innerText = humanReadableResult
    }

    const updateFeedback = async () => {
        if (knnClassifierModel.classExampleCount.R) {
            document.getElementById('train-rock-span').innerText = `${knnClassifierModel.classExampleCount.R} Samples`
        }
        if (knnClassifierModel.classExampleCount.P) {
            document.getElementById('train-paper-span').innerText = `${knnClassifierModel.classExampleCount.P} Samples`
        }
        if (knnClassifierModel.classExampleCount.S) {
            document.getElementById('train-scissor-span').innerText = `${knnClassifierModel.classExampleCount.S} Samples`
        }
        document.getElementById('start-game-button').disabled = !(knnClassifierModel.classExampleCount.R && knnClassifierModel.classExampleCount.P && knnClassifierModel.classExampleCount.S)
        document.getElementById('train-hint').style.display = (knnClassifierModel.classExampleCount.R && knnClassifierModel.classExampleCount.P && knnClassifierModel.classExampleCount.S) ? "none" : "display"
    }
}

window.onload = () => {
    initialize()
}