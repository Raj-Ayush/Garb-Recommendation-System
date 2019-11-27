import pandas as pd
import numpy as np
import random

from PIL import Image
import requests
from io import BytesIO

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
import matplotlib.pyplot as plt
from matplotlib import gridspec
from sklearn.externals import joblib

from sklearn.metrics import pairwise_distances

##########

data = pd.read_pickle(r"C:\Users\ANIMESH_VAIBHAV\Videos\Journey\AAIC\ML DataSet\Assignment-24 Apparel Recommendation [M]\pickels\16k_apperal_data_preprocessed")
print(data.shape)


###########

def display_img(url):
    gs = gridspec.GridSpec(2, 2, width_ratios=[4,1], height_ratios=[4,1]) 
    fig = plt.figure(figsize=(25,3))

    ax = plt.subplot(gs[0])
    # we don't want any grid lines for image and no labels on x-axis and y-axis
    ax.grid(False)
    ax.set_xticks([])
    ax.set_yticks([])
    # we get the url of the apparel and download it
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    # we will display it in notebook 
    plt.imshow(img)
    plt.show()

###########

tfidf_title_vectorizer = TfidfVectorizer(min_df = 0)
tfidf_title_features = tfidf_title_vectorizer.fit_transform(data['title'])
tfidf_title_features.get_shape() # get number of rows and columns in feature matrix.

############

a = list(range(data.shape[0]))

#to pick index of title random
def title_index(a):
    x=random.choice(a)
    return x

############

def tfidf_model(test_title, num_results):
    # doc_id: apparel's id in given corpus
    
    # pairwise_dist will store the distance from given input apparel to all remaining apparels
    # the metric we used here is cosine, the coside distance is mesured as K(X, Y) = <X, Y> / (||X||*||Y||)
    # http://scikit-learn.org/stable/modules/metrics.html#cosine-similarity
    tfidf_test_title =tfidf_title_vectorizer.transform(test_title)
    pairwise_dist = pairwise_distances(tfidf_title_features,tfidf_test_title)

    # np.argsort will return indices of 9 smallest distances
    indices = np.argsort(pairwise_dist.flatten())[0:num_results]
    #pdists will store the 9 smallest distances
    pdists  = np.sort(pairwise_dist.flatten())[0:num_results]

    #data frame indices of the 9 smallest distace's
    df_indices = list(data.index[indices])

    result=[]
    

    for i in range(0,len(indices)):
        # we will pass 1. doc_id, 2. title1, 3. title2, url, model
        x=dict(data.loc[df_indices[i]])
        x['euc_distance']=pdists[i]
        result.append(x)
        title = data['title'].loc[df_indices[i]]
        #display_img(data['medium_image_url'].loc[df_indices[i]])
        Title =data['title'].loc[df_indices[i]]
        ASIN = data['asin'].loc[df_indices[i]]
        BRAND =data['brand'].loc[df_indices[i]]
        Eucliden_distance =pdists[i]
        #euc_distance.append(pdists[i])
        #print(Title)
        #print('Title :',data['title'].loc[df_indices[i]])
        #print('ASIN :',data['asin'].loc[df_indices[i]])
        #print('BRAND :',data['brand'].loc[df_indices[i]])
        #print ('Eucliden distance from the given image :', pdists[i])
        #print('='*125)

    return result

#result=tfidf_model(title_index(a),6)
"""for x in result:
    print('Title :',x["title"])
    print('ASIN :',x["asin"])
    print('BRAND :',x["brand"])
    print ('Eucliden distance from the given image :', x["euc_distance"])
    display_img(x['medium_image_url'])
    print(x["euc_distance"])
    print('='*125)
    """
