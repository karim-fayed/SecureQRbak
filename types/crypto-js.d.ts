declare module 'crypto-js' {
  export = CryptoJS;
  export as namespace CryptoJS;

  namespace CryptoJS {
    namespace lib {
      class WordArray {
        static random(nBytes: number): WordArray;
        toString(encoder?: Encoder): string;
      }
    }

    namespace enc {
      class Utf8 {
        static stringify(wordArray: lib.WordArray): string;
      }
    }

    namespace AES {
      function encrypt(message: string, key: string): lib.WordArray;
      function decrypt(encrypted: string, key: string): lib.WordArray;
    }

    namespace HmacSHA256 {
      function hash(message: string, key: string): lib.WordArray;
      function stringify(wordArray: lib.WordArray): string;
    }

    namespace SHA256 {
      function hash(message: string, key: string): lib.WordArray;
      function stringify(wordArray: lib.WordArray): string;
    }

    interface Encoder {
      stringify(wordArray: lib.WordArray): string;
    }
  }
}
