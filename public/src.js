function addHeader()
{
    const doc = document.getElementsByTagName("html")[0]
    const body = document.getElementsByTagName("body")[0]
    fetch("/header").then(function (res){return res.text()}).then(
        function (res){
        const head =document.createElement("header");
        head.innerHTML = res;
        doc.insertBefore(head, body);
        document.getElementById("myresume").href = `/view-resume/${window.localStorage.getItem("username")}`
    }).catch(err => console.log(err))
}