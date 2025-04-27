function addHeader()
{
    const doc = document.getElementsByTagName("html")[0]
    fetch("header").then(function (res){return res.text()}).then(
        function (res){
        const head =document.createElement("header");
        head.innerHTML = res;
        doc.appendChild(head);
    }).catch(err => console.log(err))
}