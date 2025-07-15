// app/components/Navigation.tsx
import { Link, useLoaderData } from '@remix-run/react';

type Collection = {
  handle: string;
  title: string;
};

type LoaderData = {
  collections: Collection[];
};

export function Navigation() {
  // This uses data loaded in the root loader
  const { collections } = useLoaderData<LoaderData>();

  return (
    <nav className="flex justify-between items-center py-4 px-8 shadow bg-white">
      <div>
        <Link to="/" className="font-bold text-xl">Dutch Rusk</Link>
      </div>
      <ul className="flex gap-6 items-center">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li className="relative group">
          <span className="cursor-pointer">Shop</span>
          <ul className="absolute left-0 top-full bg-white shadow rounded hidden group-hover:block z-10">
            {collections.map((col: Collection) => (
              <li key={col.handle}>
                <Link
                  to={`/collections/${col.handle}`}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  {col.title}
                </Link>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
        {/* Add Cart/Account links if needed */}
      </ul>
    </nav>
  );
}
