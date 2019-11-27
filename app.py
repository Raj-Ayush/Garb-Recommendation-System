from flask import Flask,render_template,request,redirect,url_for
from test import *
app = Flask(__name__)
title=[]
image=[]
ti=""
@app.route('/')
def hello():
    return render_template ('index.html')

@app.route('/')
@app.route('/index.html')
def index():
    return render_template("index.html")
@app.route('/apparel.html', methods= ['GET','POST'])
def Apparels_():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template("apparel.html")


@app.route('/grs.html',)
def grs():
  #  print("Am i called")
    return render_template('grs.html',default_title=ti)

@app.route('/grs.html', methods=['POST'])
def Searched_apparel():
    print("its working")
    ti= request.form['Title']
   # print(ti,"***")
    result=tfidf_model([ti],6)
    title.clear()
    image.clear()
    for x in result:
        title.append(x["title"])
        image.append(x['medium_image_url'])
        '''print(x["euc_distance"])
        print(image[0])
        print(title[0])'''

    if(ti==""):
        return render_template('grs.html')    
    return render_template('grs_result.html',apparel_image=image[0],default_title=ti,a1j=image[1],aj=image[2],bj=image[3],cj=image[4],dj=image[5],ai=title[0],bi=title[1],ci=title[2],di=title[3],ei=title[4],fi=title[5]) 
'''@app.route('/grs_result.html', methods=['POST','GET'])
def Recommended_apparels():
    return render_template('grs_result.html',apparel_image=image[0],a1j=image[1],aj=image[2],bj=image[3],cj=image[4],dj=image[5],ai=title[0],bi=title[1],ci=title[2],di=title[3],ei=title[4],fi=title[5])
'''



if __name__ == '__main__':
    app.run()    