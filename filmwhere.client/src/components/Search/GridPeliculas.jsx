// components/MovieGrid.jsx
import CardPelicula from './CardPelicula';

const GrdiPelicula = ({ movies, viewMode, isSearching }) => {
    if (movies.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-xl opacity-70">
                    {isSearching ? 'No se encontraron películas' : 'No hay películas disponibles'}
                </div>
            </div>
        );
    }

    return (
        <div className={
            viewMode === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-4"
        }>
            {movies.map((movie, index) => (
                <CardPelicula
                    key={`${movie.id}-${index}`}
                    movie={movie}
                    viewMode={viewMode}
                />
            ))}
        </div>
    );
};

export default GrdiPelicula;