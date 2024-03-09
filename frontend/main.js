title = document.querySelector('h1')
rec = document.querySelector('#rec')

text = document.querySelector('#text')

text.addEventListener('cut', runEvent)
rec.addEventListener('mousemove',((e)=>{
    document.body.style.backgroundColor = `rgb(${e.offsetX},${e.offsetY},40)`
    
}))

function runEvent(e) {
    title.style.color = `rgb(${e.target.value.length*10},${e.target.value.length*25},40)`
    console.log(e.target.value.length)
}
