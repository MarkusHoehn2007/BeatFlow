// JavaScript to show/hide the genre select dropdown
const genreDropdown = document.getElementById('genreDropdown');
const genreSelect = document.getElementById('genreSelect');

genreDropdown.addEventListener('click', function () {
    genreSelect.classList.toggle('d-none');
});

genreSelect.addEventListener('change', function () {
    const selectedGenre = genreSelect.value;
    genreDropdown.textContent = selectedGenre;
    genreSelect.classList.add('d-none');
});

function getCadence() {
    console.log("JS loaded");
    DeviceMotionEvent.requestPermission().then(response => {
        if (response == 'granted') {
            let accelHist = []
            let avgHist = [0, 0, 0]
            let timeHist = [0]
            let longAccelHist = [1, 1]
            let cadence = 0
            let notStarted = true
            let previousSongs = []
            console.log("accelerometer permission granted");
            var headingElementEnergy = document.getElementById("energy_value");
            var headingElement = document.getElementById("accel_value");
            var headingElementCadence = document.getElementById("cadence_value")

            function processMotionEvent(event) {
                var netAccel = Math.sqrt(event.acceleration.x ** 2 + event.acceleration.y ** 2 + event.acceleration.z ** 2);
                let parsed = parseFloat(netAccel.toFixed(1));
                headingElement.textContent = "Acceleration: " + parsed;

                //acceleration smoothing
                if (accelHist.length > 20) {
                    avgAccel = accelHist.reduce(adder) / accelHist.length;
                    accelHist.shift()
                    
                    if (avgHist.length > 20) {
                        avgHist.shift();
                    }
                    avgHist.push(avgAccel)

                    //peak detection
                    if((avgHist[0] + 0.3 < avgHist[Math.floor(avgHist.length / 2)] && avgHist[avgHist.length - 1] + 0.3 < avgHist[Math.floor(avgHist.length / 2)]) ){
                        
                        pTime = new Date().getTime();
                        if(pTime - timeHist[timeHist.length] > 300){

                            longAccelHist.push(netAccel)
                            console.log('Peak detected at average acceleration: ' + avgHist[Math.floor(avgHist.length / 2)])
                            //log times
                            if (timeHist.length > 20){
                                timeHist.shift();
                            }
                        
                            timeHist.push(pTime);
                            let tdiffHist = [0];
                            for(i = 1; i < timeHist.length; i++){
                                tdiffHist[i] = timeHist[i] - timeHist[i - 1];
                            }

                            //calculate cadence
    
                            avgDiff = tdiffHist.reduce(adder) / tdiffHist.length;
    
                            cadence = 60000 / avgDiff;
                            headingElementCadence.textContent = "Cadence: " + cadence;
                        }
                    }
                }
                

                accelHist.push(netAccel);              
                
                //for averages
                function adder(total, value, index, array){
                    return total + value;
                }
                
                //Calculate energy
                if (longAccelHist.length > 10){
                    longAccelHist.shift();
                }
                var energy = (cadence ** 2) * 0.035 * longAccelHist.reduce(adder) / longAccelHist.length;
                headingElementEnergy.textContent = "Energy: " + energy;
                

                if(notStarted || (scoreSong(song, cadence, energy, previousSongs) < 0.4 && getNewSong(playlist, cadence, energy, previousSongs).id != song.id)){
                    song = getNewSong(playlist, cadence, energy, previousSongs);
                    
                }

                // Set another timeout for the next event processing after 100 milliseconds
            }

            // Add an event listener for the initial devicemotion event
            window.addEventListener('devicemotion', processMotionEvent);
        } else {
            headingElement.textContent = "Permission not granted";
        }
        });
    }

    function getNewSong(songList, idealTempo, idealEnergy, previousSongs){
        let bestSong = songList[0];
        let bestScore = -1000000;
        for(i = 0; i < songList.length; i++){
            let score = scoreSong(songList[i], idealTempo, idealEnergy, previousSongs);
            if(score > bestScore){
                bestSong = songList[i];
                bestScore = score
            }
    
        }
        return bestSong;
    }
    
    function adjustTempo(tempo, cadence){
        let possibleTempos = [tempo / 2, tempo, tempo * 2];
        possibleTempos.sort(function(a, b){return Math.abs(a - cadence) - Math.abs(b - cadence)});
        return possibleTempos[0];
    }

    function scoreSong(song, idealTempo, idealEnergy, previousSongs){
        tempoScore = 1 / Math.abs(adjustTempo(song.tempo) - idealTempo);
        energyScore = 1 / Math.abs(song.energy * 100 - idealEnergy);
        rhythmScore = Math.sqrt(song.danceability);
        score = 0.4 * rhythmScore + 0.3 * tempoScore + 0.3 * energyScore;
        if(song.time_signature % 2 > 0){
            score *= 0.5;
        }
        if(previousSongs.includes(song.id)){
            score *= 0.5;
        }
        return score;
    }