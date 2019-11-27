from flask import Flask,render_template, request,redirect,url_for


app1 = Flask(__name__)

@app1.route('/')
@app1.route('/index.html')
def index():
    return render_template("index.html")
@app1.route('/apparel.html', methods= ['GET','POST'])
def Apparels_():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template("apparel.html")
@app1.route('/code.html', methods= ['GET','POST'])
def Abo():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template("code.html")
@app1.route("/grs.html", methods= ['GET','POST'])
def g_r_s():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template("grs.html")


if __name__== "__main__":
    app1.run()