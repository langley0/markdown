module.exports = {
    'extends': [
        'airbnb-typescript/base',
    ],
    'parserOptions': {
        'project': 'tsconfig.json',
    },
    'rules': {
        'no-plusplus': ['error',{
            'allowForLoopAfterthoughts': true
        }],
    }
};
