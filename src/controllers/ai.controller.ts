import { Request, Response } from "express";
import axios from "axios"

export const generateContent = async (req:Request, resp:Response)=> {
   const { text, maxToken } = req.body

   const aiResponse = await axios.post(
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
     {
       contents: [
         {
           parts: [{ text }]
         }
       ],
       generationConfig: {
         maxOutputTokens: maxToken || 150
       }
     },
     {
       headers: {
         "Content-Type": "application/json",
         "X-goog-api-key": "AIzaSyD7DE5gFW1BTBrNd5K4CAR38q2vwoe05Kg"
       }
     }
   )

   const genratedContent =
     aiResponse.data?.candidates?.[0]?.content?.[0]?.text ||
     aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
     "No data"

   console.log(resp)

   resp.status(200).json({
     data: genratedContent
   })
}
