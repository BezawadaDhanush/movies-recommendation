import {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept:'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

const App = () => {
    const[searchTerm,setSearchTerm] =useState('');
    const[errorMessage,setErrorMessage] = useState('');
    const[movieList,setMovieList] = useState([]);
    const[trendingMovies,setTrendingMovies] = useState([]);
    const[isLoading,setIsLoading] = useState(false);
    const [debouncedSearchTerm,setDebouncedSearchTerm] = useState('');

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try{
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                :`${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;
            const response = await fetch(endpoint,API_OPTIONS);

            if(!response.ok){
                throw new Error(`Error fetching movies`);
            }
            const data = await response.json();

           if(data.Response === 'False'){
               setErrorMessage(data.Error || 'Failed to fetch movies');
           setMovieList([]);
           return;
           }
           setMovieList(Array.isArray(data.results) ? data.results : []);


          if(query && data.results.length>0){
              await updateSearchCount(query,data.results[0]);
          }

        }catch (error){
           console.error(`Error fetching movies: ${error}`);
           setErrorMessage('Failed to fetch movies.Please try again later');
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try{
         const movies = await getTrendingMovies();

         setTrendingMovies(movies);
        }catch (error){
            console.error(`Error fetching trending movies: ${error}`);
        }
    }


    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    },[]);


    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                   <img src="/hero.png" alt="Hero Banner" />

                    <h1>
                        <center> Find<span className="text-gradient"> Movies</span> You'll Enjoy Without the Hassle</center>

                    </h1>
                    
                </header>


                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2> Trending Movies </h2>
                        <ul>
                            {trendingMovies.map((movie,index) => (
                                <li key={movie.$id}>
                                    <p>{index+1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                                )
                            )}
                        </ul>

                    </section>
                )}
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <section className="all-movies">
                  <h2>All Movies</h2>
                    {isLoading ?(
                        <Spinner/>
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ):(
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}/>
                                ))}
                        </ul>
                    )}

                </section>
                    <h1 className="text-white">{searchTerm}</h1>
            </div>
        </main>
    )
}

export default App
