Vue.use(Vuetify);
var loggedIn = false;
var profile;          
  var currentPoll;  
  new Vue({
        el: '#app',
        vuetify: new Vuetify({theme: { dark: true }}),
        data:() => ({
          search : false,
          dialog: false,
          select : [],
          formValid : false,
          newPollTitle: null,
          res : "",
          pollTitle: "Loading",
          pollDialog : false,
          chart : "",
          pollItems:[],
          options: [],
          votedIndexNumb : 0,
          loadingPollModal:false,
          voted:false,
          loggedIn: loggedIn,
          logBanner : !loggedIn,
          liked:false,
          loading:true,
          snackbar:false,
          snackbarText:""
        }),
        created: function () {
          getData("/api/polls",(res)=>{
          res = JSON.parse(res);
          res.forEach(function(item){
          var labels = [];
          var voteNumb = 0;
          item.labels.forEach(function(i){
          labels.push(`"${i}"`);
          });
          item.votes.forEach(function(i){
          voteNumb += i;
          });
          item.voteNumb = voteNumb;
          item.src =`https://quickchart.io/chart?c=` + encodeURIComponent(`{type: 'pie',   data: { labels: [${labels.toString()}], datasets: [{ data: [${item.votes.toString()}] }] },   options: {     legend:{      labels:{        fontColor : '#fff'}},plugins: {datalabels: {color: '#fff'},} }}`);
          }); 
          this.res = res;
          if(location.search.replace("?")){
            this.opnPoll(location.search.replace("?",""));
            window.history.pushState('home', 'UPoll', '/');
          }
          });           
          getData("/profile",(data)=>{
            data = JSON.parse(data);
            profile = data;
            this.loggedIn = true;
            this.logBanner = false;
          });
          this.loading = false;
        },
        methods: {
        changed(){
          if(this.select.length >= 2 && this.newPollTitle){
           this.formValid = true;
          }else{
           this.formValid = false;
          }
        },
        searchPoll(e){
         this.loading=true;
         if(!e){
           getData("/api/polls",(res)=>{
           this.renderPolls(res);
           });
         }
         getData("/api/search?q="+e,(res)=>{
           this.renderPolls(res);
         });
        },
        closeSearch(){
         if(!this.search){
          this.loading=true;
          getData("/api/polls",(res)=>{
           this.renderPolls(res);
          }); 
         }
        },
        copyurl(){
         navigator.clipboard.writeText(location.href).then(() => {
         this.snackbarText = "Link Copied";
         this.snackbar = true;
         },(err) => {
          this.snackbarText = "Unable to to copy link";
          this.snackbar = true;
         });
        },
        makePoll(){
          post('/api/new', {pollName: this.newPollTitle,labels:this.select.toString()});
        },
        loved(){
         this.loading=true;
         getData("/api/loved",(res)=>{
          this.renderPolls(res);
         });  
        },
        popular(){
         this.loading=true;
         getData("/api/popular",(res)=>{
          this.renderPolls(res);
         });  
        },
        best(){
         this.loading=true;
         getData("/api/best",(res)=>{
          this.renderPolls(res);
         });  
        },
        latest(){
         this.loading=true;
         getData("/api/polls",(res)=>{
          this.renderPolls(res);
         });           
        },
        renderPolls(res){
         res = JSON.parse(res);
          res.forEach(function(item){
          var labels = [];
          var voteNumb = 0;
          item.labels.forEach(function(i){
          labels.push(`"${i}"`);
          });
          item.votes.forEach(function(i){
          voteNumb += i;
          });
          item.voteNumb = voteNumb;
          item.src =`https://quickchart.io/chart?c=` + encodeURIComponent(`{type: 'pie',   data: { labels: [${labels.toString()}], datasets: [{ data: [${item.votes.toString()}] }] },   options: {     legend:{      labels:{        fontColor : '#fff'}},plugins: {datalabels: {color: '#fff'},} }}`);
          }); 
          this.res = res;
          this.loading = false;
        },
        dismissLogBanner(){
          this.logBanner = false;
        },
        voteIndex(e){
          this.votedIndexNumb = this.options.indexOf(e);
        },
        vote(){
         this.voted = true;
         this.loadingPollModal = true;
         postData("/api/vote",{id:currentPoll,index:this.votedIndexNumb,email:profile.email},(data)=>{
            this.loadingPollModal = false;
         });
        },
        like(){
          this.liked = true;
          this.loadingPollModal = true;
          postData("/api/like",{id:currentPoll,email:profile.email},(data)=>{
            this.loadingPollModal = false;
         });
        },
        closePoll(){
         this.pollDialog = false;
         this.pollTitle = "Loading";
         window.history.pushState('home', 'UPoll', '/');
         this.loading=true;
         getData("/api/loved",(res)=>{
          this.renderPolls(res);
         });  
        },
        opnPoll(id){
          this.liked = false;
          this.votedIndexNumb = 0;
          this.loadingPollModal = true;
          this.pollDialog = true;
          currentPoll = id;
          this.voted = false;
          getData("/api/poll?id="+id,(data)=>{
            if(!data){this.pollDialog = false;return}
            window.history.pushState('home', 'UPoll', '/?'+id);
            data = JSON.parse(data);
            var labels = [];
            if(data.voters.includes(profile.email)){
            this.voted = true;
            }
            if(data.likers.includes(profile.email)){
            this.liked = true;
            }
            data.labels.forEach(function(i){
            labels.push(`"${i}"`);//DONT judge
            }); 
            this.options = data.labels;
            this.chart = `https://quickchart.io/chart?c=` + encodeURIComponent(`{type: 'pie',   data: { labels: [${labels.toString()}], datasets: [{ data: [${data.votes.toString()}] }] },   options: {     legend:{      labels:{        fontColor : '#fff'}},plugins: {datalabels: {color: '#fff'},} }}`);
            this.pollTitle = data.title;
            this.loadingPollModal = false;
          });
        }
      }
  });
function post(path, params, method='post') {
  const form = document.createElement('form');
  form.method = method;
  form.action = path;

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = key;
      hiddenField.value = params[key];
      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}
function getData(url,func){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       return func(xhttp.responseText);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}
function postData(url,json,func){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       return func(xhr.responseText);
    }
  };
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(json));
}
