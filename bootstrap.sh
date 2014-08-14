#!/bin/bash -e

BASEDIR=`dirname $0`

if [ ! -d "$BASEDIR/ve" ]; then
    virtualenv $BASEDIR/ve --no-site-packages
    echo "Virtualenv created."
fi

source $BASEDIR/ve/bin/activate
cd $BASEDIR
export PYTHONPATH=.

if [ ! -f "$BASEDIR/ve/updated" -o $BASEDIR/requirements.txt -nt $BASEDIR/ve/updated ]; then
    pip install --no-use-wheel -r $BASEDIR/requirements.txt
    touch $BASEDIR/ve/updated
    echo "Requirements installed."
fi

python ticker/server.py


