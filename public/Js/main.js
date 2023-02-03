let slideIndex = 0;
showSlides();

function showSlides() {
    let i;
    let slides = document.getElementsByClassName("slides");
    //var dots = document.getElementsByClassName("dot");
    for(i = 0; i < slides.length; i++){
        slides[i].style.display = "none";
    }
    slideIndex++;
    if(slideIndex > slides.length)
        slideIndex = 1;
    slides[slideIndex-1].style.display = "block";
    slides[slideIndex-1].style.transitionDuration = "2s";
    setTimeout(showSlides, 3000);
}